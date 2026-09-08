import ListingDetailsClient from './ListingDetailsClient';

export function generateStaticParams() {
  return [{ id: '1' }, { id: 'default' }];
}

export default function Page() {
  return <ListingDetailsClient />;
}
