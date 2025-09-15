import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-4xl font-bold mb-6 text-center'>Commuter Score App</h1>

      <div className='text-center'>
        <Button asChild size='lg'>
          <Link href='/example'>View Example</Link>
        </Button>
      </div>
    </div>
  );
}
