import React from "react";
import { Block } from "@/lib/blockSchema";

interface Props {
  block: Block;
  onChange: (b: Block) => void;
}

export const TableBlock: React.FC<Props> = ({ block, onChange }) => {
  const headers: string[] = block.data.headers || ["", ""];
  const rows: string[][] = block.data.rows || [];

  const updateHeader = (idx: number, value: string) => {
    const next = [...headers];
    next[idx] = value;
    onChange({ ...block, data: { ...block.data, headers: next } });
  };

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const next = rows.map((r, ri) =>
      ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? value : c)) : r
    );
    onChange({ ...block, data: { ...block.data, rows: next } });
  };

  const addRow = () => {
    onChange({
      ...block,
      data: { ...block.data, rows: [...rows, Array(headers.length).fill("")] },
    });
  };

  const addCol = () => {
    onChange({
      ...block,
      data: {
        ...block.data,
        headers: [...headers, ""],
        rows: rows.map((r) => [...r, ""]),
      },
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-gray-300 bg-gray-50 px-2 py-1">
                <input
                  className="w-full bg-transparent text-left font-semibold focus:outline-none"
                  value={h}
                  onChange={(e) => updateHeader(i, e.target.value)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-gray-300 px-2 py-1">
                  <input
                    className="w-full bg-transparent focus:outline-none"
                    value={cell}
                    onChange={(e) => updateCell(ri, ci, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex gap-2">
        <button className="text-xs text-gray-500 hover:text-gray-800" onClick={addRow}>
          + Row
        </button>
        <button className="text-xs text-gray-500 hover:text-gray-800" onClick={addCol}>
          + Column
        </button>
      </div>
    </div>
  );
};
