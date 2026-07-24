import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkStringify from 'remark-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

/**
 * HTMLをMarkdownに変換する
 * @param html 変換対象のHTML文字列
 * @returns Markdown文字列
 */
export const htmlToMarkdown = async (html: string): Promise<string> => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // 既にMarkdownと思われる場合はそのまま返す
  if (!isLikelyHtml(html)) {
    return html;
  }

  try {
    const result = await unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeRemark)
      .use(remarkStringify)
      .process(html);

    return String(result).trim();
  } catch (error) {
    console.error('HTML to Markdown conversion failed:', error);
    // 変換に失敗した場合は元のテキストを返す
    return html;
  }
};

/**
 * MarkdownをHTMLに変換する
 * @param markdown 変換対象のMarkdown文字列
 * @returns HTML文字列
 */
export const markdownToHtml = async (markdown: string): Promise<string> => {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  try {
    const result = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(markdown);

    return String(result).trim();
  } catch (error) {
    console.error('Markdown to HTML conversion failed:', error);
    // 変換に失敗した場合は元のテキストを返す
    return markdown;
  }
};

/**
 * 文字列がHTMLらしいかどうかを判定する
 * @param text 判定対象の文字列
 * @returns HTMLらしい場合はtrue
 */
const isLikelyHtml = (text: string): boolean => {
  // HTMLタグのパターン
  const htmlTagPattern = /<[a-zA-Z][^>]*>/;
  return htmlTagPattern.test(text);
};
