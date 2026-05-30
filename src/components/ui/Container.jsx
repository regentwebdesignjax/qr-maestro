export function Container({ children, className = "" }) {
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl ${className}`}>
      {children}
    </div>
  );
}
