// React PDF version of the letter. Each element is an absolutely positioned <View>
// whose left / top / width / height are given directly in millimetres ("20mm").

import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { fillPlaceholders, type LetterData, type LetterElement } from '@/templates/letterTemplate';

const mm = (value: number) => `${value}mm`;

export function ReactPdfLetter({
  elements,
  data,
  showBoxes = false,
}: {
  elements: LetterElement[];
  data: LetterData;
  showBoxes?: boolean;
}) {
  return (
    <Document title="A4 Letter (React PDF)">
      <Page size="A4" style={{ position: 'relative' }}>
        {elements.map((el) => (
          <View
            key={el.id}
            style={{
              position: 'absolute',
              left: mm(el.x),
              top: mm(el.y),
              width: mm(el.width),
              height: mm(el.height),
              ...(el.border
                ? { borderWidth: mm(0.3), borderColor: '#94a3b8', borderStyle: 'solid', padding: mm(3) }
                : {}),
            }}
          >
            {el.type === 'image' ? (
              el.content ? (
                <Image src={el.content} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : null
            ) : (
              <Text
                style={{
                  fontFamily: el.bold ? 'Helvetica-Bold' : 'Helvetica',
                  fontSize: el.fontSize,
                  lineHeight: el.lineHeight,
                  textAlign: el.align,
                  color: el.color,
                }}
              >
                {fillPlaceholders(el.content, data)}
              </Text>
            )}
          </View>
        ))}

        {/* Optional red outlines, drawn exactly at each element's mm box, to verify positions */}
        {showBoxes &&
          elements.map((el) => (
            <View
              key={`box-${el.id}`}
              style={{
                position: 'absolute',
                left: mm(el.x),
                top: mm(el.y),
                width: mm(el.width),
                height: mm(el.height),
                borderWidth: mm(0.2),
                borderColor: '#ef4444',
                borderStyle: 'solid',
              }}
            />
          ))}
      </Page>
    </Document>
  );
}
