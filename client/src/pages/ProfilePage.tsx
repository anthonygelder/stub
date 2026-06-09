import { useParams } from 'react-router-dom';
export function ProfilePage() {
  const { handle } = useParams();
  return <div className="p-8"><h1>Profile: {handle}</h1></div>;
}
