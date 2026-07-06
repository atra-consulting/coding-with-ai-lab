import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

/**
 * Renders a Markdown string to an HTML string.
 *
 * Bind the result with `[innerHTML]` — Angular's built-in DOM sanitizer strips
 * scripts and event handlers from the output, so no extra sanitization is needed.
 * Pure pipe: only re-runs when the input string changes.
 */
@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return marked.parse(value, { async: false, gfm: true, breaks: true });
  }
}
