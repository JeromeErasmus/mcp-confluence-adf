import { ADFDocument, ADFNode } from "../types/index.js";
import * as yaml from 'yaml';

export class ADFConverter {
  static adfToMarkdown(adf: ADFDocument, metadata?: Record<string, any>): string {
    let markdown = '';
    
    if (metadata) {
      markdown += '---\n' + yaml.stringify(metadata) + '---\n\n';
    }
    
    for (const node of adf.content) {
      markdown += this.nodeToMarkdown(node, 0);
    }
    
    return markdown.trim();
  }
  
  static markdownToADF(markdown: string): { adf: ADFDocument; metadata?: Record<string, any> } {
    let content = markdown;
    let metadata: Record<string, any> | undefined;
    
    if (markdown.startsWith('---\n')) {
      const endIndex = markdown.indexOf('\n---\n', 4);
      if (endIndex !== -1) {
        const frontmatter = markdown.substring(4, endIndex);
        metadata = yaml.parse(frontmatter);
        content = markdown.substring(endIndex + 5).trim();
      }
    }
    
    const lines = content.split('\n');
    const nodes: ADFNode[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const result = this.parseNode(lines, i);
      if (result.node) {
        nodes.push(result.node);
      }
      i = result.nextIndex;
    }
    
    return {
      adf: {
        version: 1,
        type: "doc",
        content: nodes
      },
      ...(metadata && { metadata })
    };
  }
  
  private static nodeToMarkdown(node: ADFNode, depth: number): string {
    switch (node.type) {
      case 'paragraph':
        return this.paragraphToMarkdown(node) + '\n\n';
        
      case 'heading':
        const level = node.attrs?.level || 1;
        const headingText = this.inlineToMarkdown(node.content || []);
        return '#'.repeat(level) + ' ' + headingText + '\n\n';
        
      case 'codeBlock':
        const language = node.attrs?.language || '';
        const codeContent = node.content?.[0]?.text || '';
        return '```' + language + '\n' + codeContent + '\n```\n\n';
        
      case 'blockquote':
        const quoteContent = (node.content || [])
          .map(child => this.nodeToMarkdown(child, depth + 1))
          .join('')
          .split('\n')
          .map(line => '> ' + line)
          .join('\n');
        return quoteContent + '\n\n';
        
      case 'bulletList':
        return this.listToMarkdown(node, depth, false) + '\n';
        
      case 'orderedList':
        return this.listToMarkdown(node, depth, true) + '\n';
        
      case 'listItem':
        const indent = '  '.repeat(depth);
        const content = (node.content || [])
          .map(child => this.nodeToMarkdown(child, depth))
          .join('')
          .trim();
        return indent + '- ' + content + '\n';
        
      case 'table':
        return this.tableToMarkdown(node) + '\n\n';
        
      case 'rule':
        return '---\n\n';
        
      case 'panel':
        return this.panelToMarkdown(node) + '\n\n';
        
      default:
        if (node.content) {
          return (node.content || [])
            .map(child => this.nodeToMarkdown(child, depth))
            .join('');
        }
        return '';
    }
  }
  
  private static paragraphToMarkdown(node: ADFNode): string {
    if (!node.content) return '';
    return this.inlineToMarkdown(node.content);
  }
  
  private static inlineToMarkdown(content: ADFNode[]): string {
    return content.map(node => {
      if (node.type === 'text') {
        let text = node.text || '';
        
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'strong':
                text = `**${text}**`;
                break;
              case 'em':
                text = `*${text}*`;
                break;
              case 'code':
                text = `\`${text}\``;
                break;
              case 'link':
                text = `[${text}](${mark.attrs?.href || ''})`;
                break;
              case 'strike':
                text = `~~${text}~~`;
                break;
            }
          }
        }
        
        return text;
      }
      
      if (node.type === 'hardBreak') {
        return '\n';
      }
      
      return this.nodeToMarkdown(node, 0);
    }).join('');
  }
  
  private static listToMarkdown(node: ADFNode, depth: number, ordered: boolean): string {
    if (!node.content) return '';
    
    return node.content.map((item, index) => {
      const marker = ordered ? `${index + 1}.` : '-';
      const indent = '  '.repeat(depth);
      const content = (item.content || [])
        .map(child => this.nodeToMarkdown(child, depth + 1))
        .join('')
        .trim();
      return indent + marker + ' ' + content;
    }).join('\n');
  }
  
  private static tableToMarkdown(node: ADFNode): string {
    if (!node.content) return '';
    
    const rows: string[] = [];
    let isFirstRow = true;
    
    for (const row of node.content) {
      if (row.type !== 'tableRow' || !row.content) continue;
      
      const cells = row.content.map(cell => {
        if (cell.type !== 'tableCell' && cell.type !== 'tableHeader') return '';
        const content = (cell.content || [])
          .map(child => this.nodeToMarkdown(child, 0))
          .join('')
          .trim()
          .replace(/\n/g, ' ');
        return content;
      });
      
      rows.push('| ' + cells.join(' | ') + ' |');
      
      if (isFirstRow) {
        const separator = '| ' + cells.map(() => '---').join(' | ') + ' |';
        rows.push(separator);
        isFirstRow = false;
      }
    }
    
    return rows.join('\n');
  }
  
  private static panelToMarkdown(node: ADFNode): string {
    const panelType = node.attrs?.panelType || 'info';
    const content = (node.content || [])
      .map(child => this.nodeToMarkdown(child, 0))
      .join('')
      .trim();
    
    const icons: Record<string, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅',
      note: '📝'
    };
    
    const icon = icons[panelType] || 'ℹ️';
    const typeText = panelType.charAt(0).toUpperCase() + panelType.slice(1);
    
    return `> ${icon} **${typeText}:** ${content}`;
  }
  
  private static parseNode(lines: string[], startIndex: number): { node: ADFNode | null; nextIndex: number } {
    const line = lines[startIndex]?.trim() || '';
    
    if (line === '') {
      return { node: null, nextIndex: startIndex + 1 };
    }
    
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const text = line.substring(level).trim();
      return {
        node: {
          type: 'heading',
          attrs: { level },
          content: [{ type: 'text', text }]
        },
        nextIndex: startIndex + 1
      };
    }
    
    if (line.startsWith('```')) {
      const language = line.substring(3).trim();
      const codeLines: string[] = [];
      let i = startIndex + 1;
      
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      return {
        node: {
          type: 'codeBlock',
          attrs: { language: language || undefined },
          content: [{ type: 'text', text: codeLines.join('\n') }]
        },
        nextIndex: i + 1
      };
    }
    
    if (line.startsWith('> ')) {
      const panelMatch = line.match(/^> (ℹ️|⚠️|❌|✅|📝) \*\*(\w+):\*\* (.+)$/);
      if (panelMatch) {
        const [, icon, type, content] = panelMatch;
        const panelTypeMap: Record<string, string> = {
          'ℹ️': 'info',
          '⚠️': 'warning',
          '❌': 'error',
          '✅': 'success',
          '📝': 'note'
        };
        
        return {
          node: {
            type: 'panel',
            attrs: { panelType: panelTypeMap[icon] || 'info' },
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: content }]
            }]
          },
          nextIndex: startIndex + 1
        };
      }
      
      const quoteLines: string[] = [];
      let i = startIndex;
      
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].substring(2));
        i++;
      }
      
      const quoteContent = quoteLines.join('\n');
      const { adf } = this.markdownToADF(quoteContent);
      
      return {
        node: {
          type: 'blockquote',
          content: adf.content
        },
        nextIndex: i
      };
    }
    
    if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\. /.test(line)) {
      const isOrdered = /^\d+\. /.test(line);
      const items: ADFNode[] = [];
      let i = startIndex;
      
      while (i < lines.length) {
        const currentLine = lines[i];
        const isListItem = isOrdered 
          ? /^\d+\. /.test(currentLine)
          : (currentLine.startsWith('- ') || currentLine.startsWith('* '));
        
        if (!isListItem && currentLine.trim() !== '') break;
        if (currentLine.trim() === '') {
          i++;
          continue;
        }
        
        const text = currentLine.replace(/^(\d+\. |- |\* )/, '');
        items.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: this.parseInlineMarkdown(text)
          }]
        });
        i++;
      }
      
      return {
        node: {
          type: isOrdered ? 'orderedList' : 'bulletList',
          content: items
        },
        nextIndex: i
      };
    }
    
    if (line.startsWith('| ')) {
      const tableRows: ADFNode[] = [];
      let i = startIndex;
      let isFirstRow = true;
      
      while (i < lines.length && lines[i].startsWith('| ')) {
        const currentLine = lines[i];
        
        if (currentLine.includes('---')) {
          i++;
          continue;
        }
        
        const cells = currentLine.split('|').slice(1, -1).map(cell => cell.trim());
        const cellNodes = cells.map(cellText => ({
          type: isFirstRow ? 'tableHeader' : 'tableCell',
          content: [{
            type: 'paragraph',
            content: this.parseInlineMarkdown(cellText)
          }]
        }));
        
        tableRows.push({
          type: 'tableRow',
          content: cellNodes
        });
        
        isFirstRow = false;
        i++;
      }
      
      return {
        node: {
          type: 'table',
          content: tableRows
        },
        nextIndex: i
      };
    }
    
    if (line === '---') {
      return {
        node: { type: 'rule' },
        nextIndex: startIndex + 1
      };
    }
    
    return {
      node: {
        type: 'paragraph',
        content: this.parseInlineMarkdown(line)
      },
      nextIndex: startIndex + 1
    };
  }
  
  private static parseInlineMarkdown(text: string): ADFNode[] {
    if (!text) return [];
    
    const nodes: ADFNode[] = [];
    let remaining = text;
    
    while (remaining.length > 0) {
      let match;
      
      if ((match = remaining.match(/^\*\*([^*]+)\*\*/))) {
        nodes.push({
          type: 'text',
          text: match[1],
          marks: [{ type: 'strong' }]
        });
        remaining = remaining.substring(match[0].length);
      } else if ((match = remaining.match(/^\*([^*]+)\*/))) {
        nodes.push({
          type: 'text',
          text: match[1],
          marks: [{ type: 'em' }]
        });
        remaining = remaining.substring(match[0].length);
      } else if ((match = remaining.match(/^`([^`]+)`/))) {
        nodes.push({
          type: 'text',
          text: match[1],
          marks: [{ type: 'code' }]
        });
        remaining = remaining.substring(match[0].length);
      } else if ((match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/))) {
        nodes.push({
          type: 'text',
          text: match[1],
          marks: [{ type: 'link', attrs: { href: match[2] } }]
        });
        remaining = remaining.substring(match[0].length);
      } else if ((match = remaining.match(/^~~([^~]+)~~/))) {
        nodes.push({
          type: 'text',
          text: match[1],
          marks: [{ type: 'strike' }]
        });
        remaining = remaining.substring(match[0].length);
      } else {
        const nextSpecialChar = remaining.search(/[\*`\[\~]/);
        const textLength = nextSpecialChar === -1 ? remaining.length : nextSpecialChar;
        const plainText = remaining.substring(0, textLength || 1);
        
        if (plainText) {
          nodes.push({
            type: 'text',
            text: plainText
          });
        }
        
        remaining = remaining.substring(textLength || 1);
      }
    }
    
    return nodes.length > 0 ? nodes : [{ type: 'text', text: text }];
  }
}