interface SectionHeadingProps {
  id?: string;
  title: string;
  description?: string;
}

export function SectionHeading({ id, title, description }: SectionHeadingProps) {
  return (
    <div id={id} className="mb-4 scroll-mt-16">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}
