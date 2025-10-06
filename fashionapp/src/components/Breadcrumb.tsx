interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    if (items.length === 0) return null;

    return (
        <div className="flex gap-2 mb-4">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    {item.href ? (
                        <a href={item.href} className="hover:underline">
                            {item.label}
                        </a>
                    ) : (
                        <span className="text-gray-500">{item.label}</span>
                    )}
                    {index < items.length - 1 && <span>/</span>}
                </div>
            ))}
        </div>
    );
}
