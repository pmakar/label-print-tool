"use client";

import React, { useMemo, useState } from 'react';
import { Printer, Plus, Trash2, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

function sanitize(value: string) {
  return value.trim();
}

type AreaRow = {
  id: string;
  area: string;
  count: number;
  color: string;
  contents: string;
};

type LabelItem = {
  key: string;
  jobNumber: string;
  jobName: string;
  content: string;
  area: string;
  color: string;
};

type AreaPrintItem = {
  key: string;
  area: string;
  color: string;
};

type PrintMode = 'labels' | 'areas';

const makeId = () => Math.random().toString(36).slice(2, 9);

const presetColors = [
  '#ff0000',
  '#ff7a00',
  '#c4a000',
  '#008f3a',
  '#2b00ff',
  '#7a00ff',
  '#ff00c8',
  '#111827',
  '#333F48',
  '#2D4D58',
  '#C26E60',
];

const presetAreas = [
  'MAIN',
  'PLENARY',
  'WELCOME',
  'GARDEN',
  'GLASSHOUSE',
  'BALLROOM',
  'CEREMONY',
  'AFTERPARTY',
];

const presetContentTokens = [
  'Φ',
  '13A',
  '16A',
  '32A',
  '1Φ',
  '3Φ',
  'NL4',
  'XLR',
  'VEAM',
  'ETHERCON',
  'DMX',
  'HDMI',
  'DISPLAYPORT',
  'LX',
  'NOISE',
  'VIDEO',
  'SOUND',
];

function getContentFontSize(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return '56px';

  const words = trimmed.split(/[\s.]+/).filter(Boolean);
  const longestWordLength = words.reduce((max, word) => Math.max(max, word.length), 0);

  if (longestWordLength >= 11) return '26px';
  if (longestWordLength >= 9) return '30px';
  if (words.length <= 3) return '56px';
  if (words.length <= 6) return '44px';
  return '34px';
}

function formatContentLines(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return ' ';

  const words = trimmed.split(/[\s.]+/).filter(Boolean);

  if (words.length <= 3) {
    return words.join('\n');
  }

  const lines = ['', '', ''];
  const perLine = Math.ceil(words.length / 3);

  words.forEach((word, index) => {
    const bucket = Math.min(2, Math.floor(index / perLine));
    lines[bucket] = lines[bucket] ? `${lines[bucket]} ${word}` : word;
  });

  return lines.filter(Boolean).join('\n');
}

export default function LabelPrintTool() {
  const [fontScale, setFontScale] = useState(1);
  const [printMode, setPrintMode] = useState<PrintMode>('labels');
  const [jobNumber, setJobNumber] = useState('');
  const [jobName, setJobName] = useState('');
  const [areas, setAreas] = useState<AreaRow[]>([
    { id: makeId(), area: 'MAIN', count: 0, color: presetColors[0], contents: '' },
  ]);

  const labels = useMemo<LabelItem[]>(() => {
    const out: LabelItem[] = [];
    const cleanJobNumber = sanitize(jobNumber);
    const cleanJobName = sanitize(jobName);

    areas.forEach((row) => {
      const area = sanitize(row.area);
      if (!area) return;

      const contentLabels = row.contents
        .split('\n')
        .map((line) => sanitize(line))
        .filter(Boolean);

      contentLabels.forEach((line, i) => {
        out.push({
          key: `${row.id}-content-${i}`,
          jobNumber: cleanJobNumber,
          jobName: cleanJobName,
          content: line,
          area,
          color: row.color,
        });
      });

      const emptyLabelCount = Math.max(0, Number(row.count) || 0);
      for (let i = 0; i < emptyLabelCount; i += 1) {
        out.push({
          key: `${row.id}-empty-${i}`,
          jobNumber: cleanJobNumber,
          jobName: cleanJobName,
          content: '',
          area,
          color: row.color,
        });
      }
    });

    return out;
  }, [areas, jobName, jobNumber]);

  const areaPrintItems = useMemo<AreaPrintItem[]>(() => {
    return areas
      .map((row) => ({
        key: row.id,
        area: sanitize(row.area),
        color: row.color,
      }))
      .filter((row) => row.area);
  }, [areas]);

  const updateArea = (id: string, patch: Partial<AreaRow>) => {
    setAreas((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addArea = () => {
    setAreas((current) => [
      ...current,
      {
        id: makeId(),
        area: '',
        count: 0,
        color: presetColors[current.length % presetColors.length],
        contents: '',
      },
    ]);
  };

  const duplicateArea = (id: string) => {
    const row = areas.find((item) => item.id === id);
    if (!row) return;
    setAreas((current) => [...current, { ...row, id: makeId() }]);
  };

  const removeArea = (id: string) => {
    setAreas((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current));
  };

  const printWithMode = (mode: PrintMode) => {
    setPrintMode(mode);
    document.body.setAttribute('data-print-mode', mode);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  return (
    <div className="label-tool-root min-h-screen bg-slate-50 p-4 md:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');

        body, * {
          font-family: 'Lato', sans-serif;
        }

        :root {
          --label-width: 90mm;
          --label-height: 90mm;
          --label-padding: 8mm;
          --label-gap: 5mm;
        }

        .print-wrap {
          padding: 0;
          margin: 0;
        }

        .print-only-labels {
          display: block;
        }

        .labels-grid {
          display: grid;
          grid-template-columns: repeat(2, var(--label-width));
          grid-auto-rows: var(--label-height);
          justify-content: start;
          align-content: start;
          gap: var(--label-gap);
        }

        .areas-grid {
          display: grid;
          grid-template-columns: 180mm;
          grid-auto-rows: 40mm;
          justify-content: start;
          align-content: start;
          gap: 5mm;
          width: 180mm;
        }

        .print-only-areas {
          display: none;
        }

        .label-card {
          width: var(--label-width);
          height: var(--label-height);
          padding: var(--label-padding);
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .label-content {
          flex: 1 1 auto;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          line-height: 1.05;
          white-space: pre-line;
        }

        @page {
          size: A4 portrait;
          margin: 8.5mm 12.5mm;
        }

        @media print {
          .print-only-areas {
            display: none !important;
          }

          body[data-print-mode='areas'] .print-only-labels {
            display: none !important;
          }

          body[data-print-mode='areas'] .print-only-areas {
            display: grid !important;
          }

          body[data-print-mode='labels'] .print-only-labels {
            display: block !important;
          }

          body[data-print-mode='labels'] .print-only-areas {
            display: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          .label-tool-root,
          .mx-auto,
          .max-w-7xl,
          .grid,
          .gap-6,
          .p-4,
          .md\\:p-8 {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: auto !important;
            min-height: auto !important;
            background: white !important;
          }

          .print-wrap {
            padding: 0 !important;
            margin: 0 !important;
            width: 185mm !important;
          }

          .labels-grid {
            display: grid !important;
            grid-template-columns: repeat(2, var(--label-width)) !important;
            grid-auto-rows: var(--label-height) !important;
            justify-content: start !important;
            align-content: start !important;
            gap: var(--label-gap) !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 185mm !important;
          }

          .areas-grid {
            display: grid !important;
            grid-template-columns: 180mm !important;
            grid-auto-rows: 40mm !important;
            justify-content: start !important;
            align-content: start !important;
            gap: 5mm !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 180mm !important;
          }

          .label-card {
            width: var(--label-width) !important;
            height: var(--label-height) !important;
            padding: var(--label-padding) !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[420px,1fr]">
        <Card className="no-print shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Label Print Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input placeholder="Job number" value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} />
            <Input placeholder="Job name" value={jobName} onChange={(e) => setJobName(e.target.value)} />

            <Separator />

            {areas.map((row) => (
              <div key={row.id} className="space-y-2 border-2 p-3" style={{ borderColor: row.color }}>
                <div className="text-xs font-semibold">Area:</div>
                <div className="flex flex-col gap-2">
                  <Input
                    value={row.area}
                    onChange={(e) => updateArea(row.id, { area: e.target.value })}
                    placeholder="Area:"
                    className="w-full text-center font-bold uppercase"
                    style={{
                      borderColor: row.color,
                      backgroundColor: row.color,
                      color: '#ffffff',
                      height: '64px',
                      fontSize: '2rem',
                      lineHeight: '1',
                    }}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    {presetColors.map((c) => {
                      const isSelected = row.color === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateArea(row.id, { color: c })}
                          className="h-8 w-8 border-2"
                          style={{
                            backgroundColor: c,
                            borderColor: isSelected ? '#000' : '#cbd5e1',
                            boxShadow: isSelected ? '0 0 0 2px white inset' : 'none',
                            cursor: 'pointer',
                          }}
                        />
                      );
                    })}

                    <input
                      type="color"
                      value={row.color}
                      onChange={(e) => updateArea(row.id, { color: e.target.value })}
                      className="h-8 w-8 border"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {presetAreas.map((presetArea) => (
                      <button
                        key={presetArea}
                        type="button"
                        onClick={() => updateArea(row.id, { area: presetArea })}
                        className="border px-2 py-1 text-xs"
                      >
                        {presetArea}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold">Cable trunks:</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold">Font size</div>
                    <button
                      type="button"
                      onClick={() => setFontScale((s) => Math.max(0.5, s - 0.1))}
                      className="border px-3 py-1 text-sm"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontScale((s) => Math.min(2, s + 0.1))}
                      className="border px-3 py-1 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <textarea
                    value={row.contents}
                    onChange={(e) => updateArea(row.id, { contents: e.target.value })}
                    placeholder="Cable trunks:"
                    className="w-full border p-2 text-sm"
                    rows={4}
                  />

                  <div className="mt-2 flex flex-wrap gap-2">
                    {presetContentTokens.map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => updateArea(row.id, { contents: row.contents + token + ' ' })}
                        className="border px-2 py-1 text-sm"
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs font-semibold">Empty labels</div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={row.count}
                    onChange={(e) => updateArea(row.id, { count: Math.max(0, Number(e.target.value) || 0) })}
                    placeholder="Empty labels"
                  />

                  <Button type="button" variant="outline" size="icon" onClick={() => duplicateArea(row.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>

                  <Button type="button" variant="outline" size="icon" onClick={() => removeArea(row.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addArea}>
              <Plus className="mr-2 h-4 w-4" /> Add area
            </Button>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold">{labels.length} labels</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => printWithMode('labels')}
                  className="inline-flex cursor-pointer items-center bg-black px-4 py-2 text-white hover:bg-slate-800"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print labels
                </button>
                <button
                  type="button"
                  onClick={() => printWithMode('areas')}
                  className="inline-flex cursor-pointer items-center bg-slate-700 px-4 py-2 text-white hover:bg-slate-900"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print areas
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="print-wrap">
          <div className="print-only-labels">
            <div className="labels-grid">
              {labels.map((label) => (
                <div key={label.key} className="label-card border-2 border-black bg-white shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xl" style={{ fontWeight: 600 }}>{label.jobNumber}</div>
                    <div className="text-right text-xl leading-tight" style={{ fontWeight: 600 }}>{label.jobName}</div>
                  </div>

                  <div
                    className="label-content uppercase"
                    style={{
                      fontWeight: 900,
                      fontSize: `calc(${getContentFontSize(label.content)} * ${fontScale})`,
                    }}
                  >
                    {formatContentLines(label.content)}
                  </div>

                  <div
                    className="p-3 text-center text-3xl"
                    style={{
                      fontWeight: 700,
                      backgroundColor: label.color,
                      color: '#fff',
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact' as 'exact',
                    }}
                  >
                    {label.area}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="areas-grid print-only-areas">
            <div
              style={{
                width: '180mm',
                marginBottom: '5mm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '32px',
                textTransform: 'uppercase',
                color: '#000'
              }}
            >
              {jobNumber} {jobName}
            </div>
            {areaPrintItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-center text-center text-4xl font-bold uppercase"
                style={{
                  backgroundColor: item.color,
                  color: '#fff',
                  height: '40mm',
                  width: '180mm',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact' as 'exact',
                }}
              >
                {item.area}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
