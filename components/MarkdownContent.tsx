type Props = {
  html: string;
};

export function MarkdownContent({ html }: Props) {
  return <div className="prose-content text-left text-[15px] leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: html }} />;
}
