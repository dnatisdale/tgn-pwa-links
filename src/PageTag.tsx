// src/PageTag.tsx
type Props = { route: string };

function labelFor(route: string) {
  if (route.startsWith("#/add")) return "Add";
  if (route.startsWith("#/import")) return "Import";
  if (route.startsWith("#/export")) return "Export";
  if (route.startsWith("#/about")) return "About";
  return "Browse"; // default
}

export default function PageTag({ route }: Props) {
  const text = labelFor(route);
  return (
    // small, subtle, above the footer
    <div className="fixed right-3 bottom-16 z-40">
      <div className="bg-white/95 border border-gray-200 shadow-sm rounded-full px-2.5 py-0.5 text-[10px] leading-4 text-gray-700">
        {text}
      </div>
    </div>
  );
}
