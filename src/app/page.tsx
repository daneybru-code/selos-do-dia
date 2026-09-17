import ViewerGate from '@/components/ViewerGate';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  return <ViewerGate message={message} />;
}
