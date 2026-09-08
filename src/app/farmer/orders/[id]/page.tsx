import OrderDetailsClient from './OrderDetailsClient';

export function generateStaticParams() {
  return [{ id: '1' }, { id: 'default' }];
}

export default function Page() {
  return <OrderDetailsClient />;
}
