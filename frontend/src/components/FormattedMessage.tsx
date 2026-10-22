import React from 'react';
import {
  ShieldCheck,
  FileText,
  Sparkles,
  BookOpen,
  Calendar,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight
} from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  role: 'assistant' | 'user' | 'system';
  onActionClick?: (actionText: string) => void;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({
  content,
  role,
  onActionClick
}) => {
  if (role === 'user') {
    return (
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.92rem' }}>
        {content}
      </div>
    );
  }

  // Parse inline styles: bold (**text**), code (`text`), italic (*text*)
  const renderInlineFormatted = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={idx} style={{ color: '#f8fafc', fontWeight: 600 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={idx}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '0.84em',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
        return (
          <em key={idx} style={{ color: '#94a3b8', fontStyle: 'italic' }}>
            {part.slice(1, -1)}
          </em>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Helper to extract clean structured excerpt from document chunks
  const parseExcerptContent = (raw: string) => {
    const headerMatch = raw.match(/^(\d+:\s*)?([A-Za-z0-9\s/–&,-]+?)\s+Page\s+(\d+)\s+([A-Z].*)$/s);
    if (headerMatch) {
      return {
        title: headerMatch[2].trim(),
        page: headerMatch[3],
        body: headerMatch[4].trim()
      };
    }
    return {
      title: null,
      page: null,
      body: raw.trim()
    };
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Empty lines -> add vertical rhythm
    if (!line) {
      elements.push(<div key={`spacer-${i}`} style={{ height: '8px' }} />);
      i++;
      continue;
    }

    // 2. Intro banner: "Based on your uploaded documents:"
    if (line.toLowerCase().startsWith('based on your uploaded documents')) {
      elements.push(
        <div
          key={`intro-${i}`}
          className="glass-box-subtle"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            marginBottom: '12px',
            borderRadius: '9999px',
            color: '#7dd3fc',
            fontSize: '0.84rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 1.5px rgba(255, 255, 255, 0.25)'
          }}
        >
          <Sparkles size={15} color="#38bdf8" />
          <span>Grounded Findings from Your Documents</span>
        </div>
      );
      i++;
      continue;
    }

    // 3. Horizontal Divider (---)
    if (line === '---' || line === '***') {
      elements.push(
        <div
          key={`divider-${i}`}
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.4), transparent)',
            margin: '14px 0',
            border: 'none'
          }}
        />
      );
      i++;
      continue;
    }

    // 4. Verification Shield Section (🛡️ Authoritative Execution Verification)
    if (line.includes('🛡️') || line.includes('Authoritative Execution Verification')) {
      const cardLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('###')) {
        cardLines.push(lines[i].trim());
        i++;
      }

      elements.push(
        <div
          key={`verify-card-${i}`}
          className="glass-box"
          style={{
            margin: '14px 0',
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.35) 0%, rgba(4, 30, 48, 0.55) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            borderTop: '1.5px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.45), inset 0 1.5px 2px rgba(255, 255, 255, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 600, fontSize: '0.92rem' }}>
            <ShieldCheck size={18} color="#34d399" />
            <span>{renderInlineFormatted(cardLines[0].replace('🛡️', '').trim())}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '4px' }}>
            {cardLines.slice(1).map((subLine, subIdx) => (
              <div
                key={subIdx}
                style={{
                  fontSize: '0.84rem',
                  color: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{renderInlineFormatted(subLine.replace(/^[*-]\s*/, ''))}</span>
              </div>
            ))}
          </div>
        </div>
      );
      continue;
    }

    // 5. Section Headings (### or ####)
    if (line.startsWith('### ')) {
      const headingText = line.replace(/^###\s+/, '');
      elements.push(
        <div
          key={`h3-${i}`}
          style={{
            fontSize: '1.02rem',
            fontWeight: 600,
            color: '#38bdf8',
            margin: '16px 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: '0.01em'
          }}
        >
          <Sparkles size={15} color="#38bdf8" />
          <span>{renderInlineFormatted(headingText)}</span>
        </div>
      );
      i++;
      continue;
    }

    if (line.startsWith('#### ')) {
      const headingText = line.replace(/^####\s+/, '');
      elements.push(
        <div
          key={`h4-${i}`}
          style={{
            fontSize: '0.925rem',
            fontWeight: 600,
            color: '#93c5fd',
            margin: '12px 0 6px 0'
          }}
        >
          {renderInlineFormatted(headingText)}
        </div>
      );
      i++;
      continue;
    }

    // 6. Blockquotes & Document Excerpts (> ...)
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }

      const rawQuote = quoteLines.join(' ');
      const isNotice = rawQuote.toLowerCase().includes('notice') || rawQuote.toLowerCase().includes('approval');
      const parsed = parseExcerptContent(rawQuote);

      elements.push(
        <div
          key={`quote-${i}`}
          className="glass-box"
          style={{
            margin: '12px 0',
            padding: '16px 20px',
            borderRadius: '16px',
            background: isNotice
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(180, 83, 9, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(14, 38, 100, 0.45) 0%, rgba(6, 20, 60, 0.65) 100%)',
            borderLeft: isNotice ? '4px solid #f59e0b' : '4px solid #38bdf8',
            borderTop: '1.5px solid rgba(255, 255, 255, 0.28)',
            borderRight: '1px solid rgba(255, 255, 255, 0.14)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4), inset 0 1.5px 2px rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Header row if parsed title exists */}
          {parsed.title ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem' }}>
                <BookOpen size={16} color="#38bdf8" />
                <span>{parsed.title}</span>
              </div>
              {parsed.page && (
                <span
                  className="badge badge-low"
                  style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  Page {parsed.page}
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isNotice ? '#f59e0b' : '#38bdf8', fontSize: '0.82rem', fontWeight: 600 }}>
              {isNotice ? <AlertCircle size={15} /> : <Info size={15} />}
              <span>{isNotice ? 'Important Notice' : 'Grounded Excerpt'}</span>
            </div>
          )}

          {/* Excerpt Body */}
          <div
            style={{
              fontSize: '0.91rem',
              lineHeight: '1.7',
              color: isNotice ? '#fde68a' : '#e2e8f0'
            }}
          >
            {renderInlineFormatted(parsed.body)}
          </div>
        </div>
      );
      continue;
    }

    // 7. Source Citation Badges: *(Source: ...)* or 📍 **Source**: ...
    if (
      line.startsWith('*(Source:') ||
      line.startsWith('*Source:') ||
      line.startsWith('📍') ||
      (line.includes('[') && line.includes('Page') && line.includes(']'))
    ) {
      const cleanCitation = line.replace(/^[📍*()\s]+|[()\s*]+$/g, '').trim();
      elements.push(
        <div
          key={`source-badge-${i}`}
          className="glass-box-subtle"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 14px',
            borderRadius: '9999px',
            color: '#7dd3fc',
            fontSize: '0.8rem',
            fontWeight: 500,
            margin: '4px 0 12px 0',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3), inset 0 1px 1.5px rgba(255, 255, 255, 0.25)'
          }}
        >
          <FileText size={14} color="#38bdf8" />
          <span>{renderInlineFormatted(cleanCitation)}</span>
        </div>
      );
      i++;
      continue;
    }

    // 8. Follow-up "How would you like to proceed?" + Liquid Action Buttons
    if (
      line.toLowerCase().includes('how would you like to proceed') ||
      line.toLowerCase().includes('i can create tasks, arrange a study schedule')
    ) {
      // Gather any bullet points that follow
      const actionBullets: string[] = [];
      i++;
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        actionBullets.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }

      elements.push(
        <div
          key={`action-prompt-${i}`}
          className="glass-box"
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(20, 48, 120, 0.45) 0%, rgba(8, 24, 70, 0.65) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderTop: '1.5px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1.5px 2px rgba(255, 255, 255, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontWeight: 600, fontSize: '0.9rem' }}>
            <Sparkles size={16} color="#38bdf8" />
            <span>Suggested Next Actions</span>
          </div>

          <p style={{ margin: 0, fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            Choose an agent action below or continue the conversation:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => onActionClick && onActionClick('Create tasks for this material')}
              className="btn btn-primary liquid-btn"
              style={{
                fontSize: '0.835rem',
                padding: '8px 18px',
                cursor: onActionClick ? 'pointer' : 'default'
              }}
            >
              <ListTodo size={14} />
              <span>Create Revision Tasks</span>
              <ArrowRight size={12} />
            </button>

            <button
              type="button"
              onClick={() => onActionClick && onActionClick('Schedule study sessions for this material')}
              className="btn btn-secondary liquid-btn"
              style={{
                fontSize: '0.835rem',
                padding: '8px 18px',
                cursor: onActionClick ? 'pointer' : 'default'
              }}
            >
              <Calendar size={14} color="#60a5fa" />
              <span>Schedule Study Sessions</span>
              <ArrowRight size={12} color="#60a5fa" />
            </button>

            <button
              type="button"
              onClick={() => onActionClick && onActionClick('Generate a practice quiz on this topic')}
              className="btn btn-accent-outline liquid-btn"
              style={{
                fontSize: '0.835rem',
                padding: '8px 18px',
                cursor: onActionClick ? 'pointer' : 'default'
              }}
            >
              <Sparkles size={14} color="#c084fc" />
              <span>Generate Practice Quiz</span>
              <ArrowRight size={12} color="#c084fc" />
            </button>
          </div>
        </div>
      );
      continue;
    }

    // 9. Bullet Lists (- ... or * ...)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }

      elements.push(
        <div
          key={`list-${i}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            margin: '8px 0',
            paddingLeft: '4px'
          }}
        >
          {listItems.map((item, itemIdx) => (
            <div
              key={itemIdx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.895rem',
                lineHeight: '1.65'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#38bdf8',
                  boxShadow: '0 0 8px rgba(56, 189, 248, 0.95)',
                  display: 'inline-block',
                  flexShrink: 0,
                  marginTop: '8px'
                }}
              />
              <div style={{ flex: 1, color: '#e2e8f0' }}>{renderInlineFormatted(item)}</div>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // 10. Default Regular Paragraph
    elements.push(
      <p
        key={`p-${i}`}
        style={{
          margin: '6px 0',
          fontSize: '0.915rem',
          lineHeight: '1.7',
          color: '#e2e8f0'
        }}
      >
        {renderInlineFormatted(line)}
      </p>
    );
    i++;
  }

  return <div style={{ display: 'flex', flexDirection: 'column' }}>{elements}</div>;
};
