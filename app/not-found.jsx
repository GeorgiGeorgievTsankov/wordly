import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you are looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </div>

        <Link href="/" className="block">
          <Button className="w-full">
            <Home className="w-4 h-4 mr-2" />
            <span>Return to Wordly Home</span>
          </Button>
        </Link>
      </Card>
    </div>
  );
}

