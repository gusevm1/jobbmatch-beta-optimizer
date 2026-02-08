export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <main className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          JobbMatch Beta Optimizer
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Upload your CV to get an AI-optimized version tailored to a job
          description
        </p>
      </main>
    </div>
  );
}
