import '../config';
import { prisma } from '../lib/prisma';
import { renderAndSaveStub } from '../services/render.service';

async function processPendingRenders() {
  const stubs = await prisma.stub.findMany({
    where: { generatedImageUrl: null, isDraft: false },
    include: { event: true, user: { select: { id: true, handle: true, displayName: true } } },
    take: 20,
  });

  let rendered = 0;
  for (const stub of stubs) {
    try {
      const path = await renderAndSaveStub(stub.id, {
        eventTitle: stub.event.title,
        eventType: stub.event.type,
        venueName: stub.event.venueName || undefined,
        venueCity: stub.event.venueCity || undefined,
        eventDate: stub.event.eventDate.toISOString(),
        seat: (stub.personalData as any)?.seat,
        companions: (stub.personalData as any)?.companions,
        userName: stub.user.displayName,
        userHandle: stub.user.handle,
        stubNumber: 0,
      });

      await prisma.stub.update({
        where: { id: stub.id },
        data: { generatedImageUrl: path },
      });
      rendered++;
    } catch (err) {
      console.error(`Render failed for stub ${stub.id}:`, err);
    }
  }

  console.log(`Rendered ${rendered}/${stubs.length} stubs`);
  return rendered;
}

processPendingRenders()
  .then(n => { console.log(`Done: ${n} rendered`); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
