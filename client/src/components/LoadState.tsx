export function LoadingState({ label = 'Loading catalogue…' }: { label?: string }) {
  return <div className="load-state" role="status"><span className="loader" />{label}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="error-state" role="alert"><p>{message}</p>{onRetry && <button className="button button--outline" onClick={onRetry}>Try again</button>}</div>;
}
