import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;

  beforeEach(() => {
    pipe = new MarkdownPipe();
  });

  it('returns an empty string for null/undefined/empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('renders an ATX heading as an <h2>', () => {
    const html = pipe.transform('## Ziel');
    expect(html).toContain('<h2');
    expect(html).toContain('Ziel');
  });

  it('renders a dash list as a <ul> with <li> items', () => {
    const html = pipe.transform('- eins\n- zwei');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>eins');
    expect(html).toContain('<li>zwei');
  });

  it('renders inline code with a <code> element', () => {
    const html = pipe.transform('Nutze `is_favorit` als Spalte.');
    expect(html).toContain('<code>is_favorit</code>');
  });

  it('renders bold text with <strong>', () => {
    expect(pipe.transform('Das ist **wichtig**.')).toContain('<strong>wichtig</strong>');
  });

  it('wraps plain text in a paragraph', () => {
    expect(pipe.transform('Nur ein Satz.')).toContain('<p>Nur ein Satz.');
  });
});
