import { type LucideProps } from 'lucide-react';

function Spinner(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function Google(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21.8 10.2c.2 1.2.2 2.4.2 3.4 0 3.5-1.2 6.5-3.6 8.6-2.2 2-5.2 3.1-8.7 3.1-4.8 0-8.7-3.9-8.7-8.7S4.3 2.5 9.1 2.5c2.4 0 4.4.9 6 2.4l-2.4 2.4c-.6-.6-1.5-1-2.6-1-2.2 0-4.1 1.8-4.1 4.1s1.9 4.1 4.1 4.1c1.3 0 2.2-.5 2.9-1.1.5-.4.9-1 1.1-1.8h-4v-3.1h7.2c.1.5.2 1 .2 1.6z" />
    </svg>
  );
}

function GitHub(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.9 3.9 0 0 0-1.1-2.7c.4-.4.8-1 .9-1.6.1-.4 0-.8-.2-1.2 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.2.4.2.8.2 1.2 0 .6-.3 1.2-.9 1.6.7.8 1.1 1.8 1.1 2.8V22" />
    </svg>
  );
}

function ChevronLeft(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

// Export all icons as a single Icons object
export const Icons = {
  spinner: Spinner,
  google: Google,
  gitHub: GitHub,
  chevronLeft: ChevronLeft,
};

// Export individual components for direct import if needed
export { Spinner, Google, GitHub, ChevronLeft };
