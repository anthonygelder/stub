import { prisma } from '../lib/prisma';
import { parseEmail } from './email-parser.service';
import { importEvents } from './import.service';
import { logger } from '../lib/logger';

export interface InboundEmail {
  to: string;
  from: string;
  subject: string;
  text: string;
}

export interface IngestResult {
  matched: boolean; // recipient resolved to a known user
  parsed: boolean; // the email parsed into a stub
  drafts: number; // draft stubs created
}

// Pull the user's @stub.app forward address out of the recipient field, which
// may be "Name <handle.abcd@stub.app>" or a comma-separated list of addresses.
function extractForwardAddress(to: string): string | null {
  const match = to.match(/[\w.+-]+@stub\.app/i);
  return match ? match[0] : null;
}

export async function ingestInboundEmail(email: InboundEmail): Promise<IngestResult> {
  const address = extractForwardAddress(email.to || '');
  if (!address) return { matched: false, parsed: false, drafts: 0 };

  const user = await prisma.user.findFirst({
    where: { emailForwardAddress: { equals: address, mode: 'insensitive' } },
    select: { id: true },
  });
  if (!user) {
    // Unknown recipient — ignore quietly (don't reveal which addresses exist).
    logger.warn('Inbound email for unknown forward address', { address });
    return { matched: false, parsed: false, drafts: 0 };
  }

  // Reconstruct a minimal raw email so the existing parser can read From/Subject/body.
  const raw = `From: ${email.from || ''}\nSubject: ${email.subject || ''}\n\n${email.text || ''}`;
  const item = parseEmail(raw);
  if (!item) {
    logger.info('Inbound email did not parse into a stub', { userId: user.id });
    return { matched: true, parsed: false, drafts: 0 };
  }

  const result = await importEvents(user.id, 'email', [item]);
  return { matched: true, parsed: true, drafts: result.stubs.length };
}
