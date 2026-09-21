import { lazy } from 'react';
import {
  ArrowLeftRight,
  Award,
  Barcode,
  Binary,
  Blend,
  Braces,
  Calculator,
  CalendarClock,
  CaseSensitive,
  Clock,
  Database,
  Diff as DiffIcon,
  Eraser,
  FileCode2,
  FileText,
  Files,
  Fingerprint,
  Film,
  Globe,
  Hash,
  Image as ImageIcon,
  KeyRound,
  KeySquare,
  Landmark,
  Link2,
  ListX,
  Lock,
  Merge,
  Pipette,
  QrCode,
  Receipt,
  Regex,
  Shrink,
  Stamp,
  Wallet,
} from 'lucide-react';

import type { ToolDefinition, ToolGroup } from './types';

/**
 * The registry is the single source of truth: routes, the ⌘K palette, category
 * pages, favorites and recents all read from it. To add a tool, drop a folder
 * under src/tools/<category>/<tool-id>/ with a default-exported component and
 * add one entry here — see README ("Add a tool").
 *
 * Every tool below is lazy-loaded: heavy deps (pdf-lib, pdf.js, ffmpeg.wasm,
 * ONNX) stay in per-tool chunks and are only fetched when the tool opens.
 */

const JsonFormatter = lazy(() => import('./developer/json-formatter'));
const SqlFormatter = lazy(() => import('./developer/sql-formatter'));
const DataConverter = lazy(() => import('./developer/data-converter'));
const JsonToTs = lazy(() => import('./developer/json-to-ts'));
const JwtDecoder = lazy(() => import('./developer/jwt-decoder'));
const Base64Encoder = lazy(() => import('./developer/base64-encoder'));
const UrlEncoder = lazy(() => import('./developer/url-encoder'));
const HashGenerator = lazy(() => import('./developer/hash-generator'));
const UuidGenerator = lazy(() => import('./developer/uuid-generator'));
const RegexTester = lazy(() => import('./developer/regex-tester'));
const DiffChecker = lazy(() => import('./developer/diff-checker'));
const CaseConverter = lazy(() => import('./developer/case-converter'));
const DuplicateRemover = lazy(() => import('./developer/duplicate-remover'));
const ColorContrastChecker = lazy(() => import('./developer/color-contrast-checker'));
const CssEffects = lazy(() => import('./developer/css-effects'));
const SvgOptimizer = lazy(() => import('./developer/svg-optimizer'));
const UnixTimestamp = lazy(() => import('./developer/unix-timestamp'));
const CronParser = lazy(() => import('./developer/cron-parser'));
const HttpStatusLookup = lazy(() => import('./developer/http-status'));

const PlaceholderPdfTool = lazy(() => import('./everyday/fake-pdf-generator'));
const ReceiptInvoiceTool = lazy(() => import('./everyday/receipt-invoice-generator'));
const CertificateGenerator = lazy(() => import('./everyday/certificate-generator'));
const PdfMerger = lazy(() => import('./everyday/pdf-merger'));
const PdfPageExtractor = lazy(() => import('./everyday/pdf-page-extractor'));
const PdfWatermarker = lazy(() => import('./everyday/pdf-watermarker'));
const ImageConverter = lazy(() => import('./everyday/image-converter'));
const BackgroundRemover = lazy(() => import('./everyday/background-remover'));
const MediaConverter = lazy(() => import('./everyday/media-converter'));
const QrTools = lazy(() => import('./everyday/qr-tools'));
const BarcodeGenerator = lazy(() => import('./everyday/barcode-generator'));
const FileEncryptor = lazy(() => import('./everyday/file-encryptor'));
const PasswordGenerator = lazy(() => import('./everyday/password-generator'));
const LoanCalculator = lazy(() => import('./everyday/loan-calculator'));
const SalaryConverter = lazy(() => import('./everyday/salary-converter'));
const TipCalculator = lazy(() => import('./everyday/tip-calculator'));

export const TOOL_GROUPS: ToolGroup[] = [
  { category: 'developer', id: 'code-data', label: 'Code & data' },
  { category: 'developer', id: 'crypto', label: 'Encoding & crypto' },
  { category: 'developer', id: 'text', label: 'Text & regex' },
  { category: 'developer', id: 'frontend', label: 'Frontend & design' },
  { category: 'developer', id: 'time-net', label: 'Time & network' },
  { category: 'everyday', id: 'pdf', label: 'PDF & documents' },
  { category: 'everyday', id: 'media', label: 'Images & media' },
  { category: 'everyday', id: 'security', label: 'Codes & security' },
  { category: 'everyday', id: 'calcs', label: 'Calculators' },
];

export const toolRegistry: ToolDefinition[] = [
  // — Developer · Code & data —
  {
    id: 'json-formatter',
    name: 'JSON formatter',
    blurb: 'Pretty-print, minify and validate JSON, with the error position called out.',
    category: 'developer',
    group: 'code-data',
    keywords: ['json', 'prettify', 'pretty', 'minify', 'validate', 'format', 'lint', 'jsonl'],
    icon: Braces,
    status: 'ready',
    component: JsonFormatter,
  },
  {
    id: 'sql-formatter',
    name: 'SQL formatter',
    blurb: 'Reformat and indent SQL queries for your dialect.',
    category: 'developer',
    group: 'code-data',
    keywords: ['sql', 'query', 'format', 'indent', 'beautify', 'postgres', 'mysql'],
    icon: Database,
    status: 'ready',
    component: SqlFormatter,
  },
  {
    id: 'data-converter',
    name: 'YAML / JSON / CSV converter',
    blurb: 'Convert structured and tabular data between YAML, JSON and CSV.',
    category: 'developer',
    group: 'code-data',
    keywords: ['yaml', 'csv', 'json', 'convert', 'tsv', 'spreadsheet', 'tabular'],
    icon: ArrowLeftRight,
    status: 'ready',
    component: DataConverter,
  },
  {
    id: 'json-to-ts',
    name: 'JSON to TypeScript',
    blurb: 'Generate TypeScript interfaces from a JSON sample.',
    category: 'developer',
    group: 'code-data',
    keywords: ['typescript', 'interface', 'types', 'generate', 'json', 'ts', 'model'],
    icon: FileCode2,
    status: 'ready',
    component: JsonToTs,
  },

  // — Developer · Encoding & crypto —
  {
    id: 'jwt-decoder',
    name: 'JWT decoder',
    blurb: 'Inspect the header, payload and expiry of a token — locally, obviously.',
    category: 'developer',
    group: 'crypto',
    keywords: ['jwt', 'token', 'auth', 'decode', 'bearer', 'claims', 'expiry'],
    icon: KeySquare,
    status: 'ready',
    component: JwtDecoder,
  },
  {
    id: 'base64-encoder',
    name: 'Base64 encoder',
    blurb: 'Encode and decode text or files to Base64, straight from disk.',
    category: 'developer',
    group: 'crypto',
    keywords: ['base64', 'encode', 'decode', 'file', 'blob', 'data url', 'atob'],
    icon: Binary,
    status: 'ready',
    component: Base64Encoder,
  },
  {
    id: 'url-encoder',
    name: 'URL encoder',
    blurb: 'Percent-encode or decode URLs and query strings.',
    category: 'developer',
    group: 'crypto',
    keywords: ['url', 'uri', 'percent', 'encode', 'decode', 'escape', 'querystring'],
    icon: Link2,
    status: 'ready',
    component: UrlEncoder,
  },
  {
    id: 'hash-generator',
    name: 'Hash generator',
    blurb: 'MD5, SHA-1, SHA-256 and SHA-512 digests via the Web Crypto API.',
    category: 'developer',
    group: 'crypto',
    keywords: ['hash', 'md5', 'sha', 'checksum', 'digest', 'sha256', 'sha512'],
    icon: Hash,
    status: 'ready',
    component: HashGenerator,
  },
  {
    id: 'uuid-generator',
    name: 'UUID generator',
    blurb: 'Bulk-generate UUID v4 and ULID identifiers with one keystroke.',
    category: 'developer',
    group: 'crypto',
    keywords: ['uuid', 'guid', 'ulid', 'identifier', 'random', 'v4'],
    icon: Fingerprint,
    status: 'ready',
    component: UuidGenerator,
  },

  // — Developer · Text & regex —
  {
    id: 'regex-tester',
    name: 'Regex tester',
    blurb: 'Test regular expressions against sample text with match highlighting.',
    category: 'developer',
    group: 'text',
    keywords: ['regex', 'regexp', 'regular expression', 'match', 'pattern', 'test'],
    icon: Regex,
    status: 'ready',
    component: RegexTester,
  },
  {
    id: 'diff-checker',
    name: 'Diff checker',
    blurb: 'Compare two texts or code snippets side by side, line by line.',
    category: 'developer',
    group: 'text',
    keywords: ['diff', 'compare', 'changes', 'side by side', 'merge', 'text compare'],
    icon: DiffIcon,
    status: 'ready',
    component: DiffChecker,
  },
  {
    id: 'case-converter',
    name: 'Case converter',
    blurb: 'camelCase, snake_case, kebab-case, PascalCase, Title Case and more.',
    category: 'developer',
    group: 'text',
    keywords: ['case', 'camel', 'snake', 'kebab', 'pascal', 'uppercase', 'lowercase', 'title', 'convert'],
    icon: CaseSensitive,
    status: 'ready',
    component: CaseConverter,
  },
  {
    id: 'duplicate-remover',
    name: 'Duplicate line remover',
    blurb: 'Drop duplicate lines from a list, with sort and trim options.',
    category: 'developer',
    group: 'text',
    keywords: ['duplicate', 'dedupe', 'unique', 'lines', 'list', 'deduplicate'],
    icon: ListX,
    status: 'ready',
    component: DuplicateRemover,
  },

  // — Developer · Frontend & design —
  {
    id: 'color-contrast-checker',
    name: 'Color & contrast checker',
    blurb: 'Pick colors and check WCAG AA/AAA contrast ratios as you go.',
    category: 'developer',
    group: 'frontend',
    keywords: ['color', 'contrast', 'wcag', 'accessibility', 'picker', 'hex', 'rgb', 'a11y'],
    icon: Pipette,
    status: 'ready',
    component: ColorContrastChecker,
  },
  {
    id: 'css-effects',
    name: 'Shadow & gradient generator',
    blurb: 'Compose CSS box-shadows and gradients visually, copy the CSS out.',
    category: 'developer',
    group: 'frontend',
    keywords: ['css', 'box-shadow', 'gradient', 'generator', 'style', 'design'],
    icon: Blend,
    status: 'ready',
    component: CssEffects,
  },
  {
    id: 'svg-optimizer',
    name: 'SVG optimizer',
    blurb: 'Strip metadata and round coordinates to shrink SVG files.',
    category: 'developer',
    group: 'frontend',
    keywords: ['svg', 'optimize', 'minify', 'compress', 'vector', 'clean'],
    icon: Shrink,
    status: 'ready',
    component: SvgOptimizer,
  },

  // — Developer · Time & network —
  {
    id: 'unix-timestamp',
    name: 'Unix timestamp converter',
    blurb: 'Convert between Unix epochs and human dates, in either direction.',
    category: 'developer',
    group: 'time-net',
    keywords: ['unix', 'timestamp', 'epoch', 'date', 'time', 'convert', 'iso8601'],
    icon: Clock,
    status: 'ready',
    component: UnixTimestamp,
  },
  {
    id: 'cron-parser',
    name: 'Cron explainer',
    blurb: 'Parse cron expressions into plain language and preview upcoming runs.',
    category: 'developer',
    group: 'time-net',
    keywords: ['cron', 'crontab', 'schedule', 'expression', 'next run'],
    icon: CalendarClock,
    status: 'ready',
    component: CronParser,
  },
  {
    id: 'http-status',
    name: 'HTTP status lookup',
    blurb: 'Search HTTP status codes with meaning and usage notes.',
    category: 'developer',
    group: 'time-net',
    keywords: ['http', 'status', 'code', '404', '500', 'reference', 'rest'],
    icon: Globe,
    status: 'ready',
    component: HttpStatusLookup,
  },

  // — Everyday · PDF & documents —
  {
    id: 'fake-pdf-generator',
    name: 'Placeholder PDF generator',
    blurb: 'Multi-page lorem or wireframe PDFs for mockups and print tests.',
    category: 'everyday',
    group: 'pdf',
    keywords: ['pdf', 'lorem', 'ipsum', 'placeholder', 'dummy', 'mockup', 'wireframe', 'print', 'pages'],
    icon: FileText,
    status: 'ready',
    component: PlaceholderPdfTool,
  },
  {
    id: 'receipt-invoice-generator',
    name: 'Receipt & invoice generator',
    blurb: 'Build believable sample receipts and invoices, exported as PDF.',
    category: 'everyday',
    group: 'pdf',
    keywords: ['receipt', 'invoice', 'pdf', 'bill', 'thermal', 'mock', 'prop', 'expense'],
    icon: Receipt,
    status: 'ready',
    component: ReceiptInvoiceTool,
  },
  {
    id: 'certificate-generator',
    name: 'Certificate generator',
    blurb: 'Design completion certificates and award diplomas, exported as PDF.',
    category: 'everyday',
    group: 'pdf',
    keywords: ['certificate', 'diploma', 'award', 'completion', 'pdf', 'template'],
    icon: Award,
    status: 'ready',
    component: CertificateGenerator,
  },
  {
    id: 'pdf-merger',
    name: 'PDF merger',
    blurb: 'Combine several PDFs into one, entirely on this machine.',
    category: 'everyday',
    group: 'pdf',
    keywords: ['pdf', 'merge', 'combine', 'join', 'concatenate'],
    icon: Merge,
    status: 'ready',
    component: PdfMerger,
  },
  {
    id: 'pdf-page-extractor',
    name: 'PDF page extractor',
    blurb: 'Pull selected pages out of a PDF and save them as a new file.',
    category: 'everyday',
    group: 'pdf',
    keywords: ['pdf', 'extract', 'pages', 'split', 'remove'],
    icon: Files,
    status: 'ready',
    component: PdfPageExtractor,
  },
  {
    id: 'pdf-watermarker',
    name: 'PDF watermarker',
    blurb: 'Stamp text or image watermarks across every page.',
    category: 'everyday',
    group: 'pdf',
    keywords: ['pdf', 'watermark', 'stamp', 'draft', 'confidential', 'brand'],
    icon: Stamp,
    status: 'ready',
    component: PdfWatermarker,
  },

  // — Everyday · Images & media —
  {
    id: 'image-converter',
    name: 'Image converter & resizer',
    blurb: 'Convert PNG/JPG/WebP/AVIF and resize, all on the canvas API.',
    category: 'everyday',
    group: 'media',
    keywords: ['image', 'convert', 'resize', 'png', 'jpg', 'webp', 'avif', 'canvas', 'compress'],
    icon: ImageIcon,
    status: 'ready',
    component: ImageConverter,
  },
  {
    id: 'background-remover',
    name: 'AI background remover',
    blurb: 'Cut subjects out of photos with an on-device AI model.',
    category: 'everyday',
    group: 'media',
    keywords: ['background', 'remove', 'cutout', 'ai', 'alpha', 'transparent', 'portrait'],
    icon: Eraser,
    status: 'ready',
    component: BackgroundRemover,
  },
  {
    id: 'media-converter',
    name: 'Media trimmer & converter',
    blurb: 'Trim and convert audio/video in the browser via WebAssembly.',
    category: 'everyday',
    group: 'media',
    keywords: ['video', 'audio', 'trim', 'cut', 'convert', 'ffmpeg', 'webm', 'mp4', 'mp3'],
    icon: Film,
    status: 'ready',
    component: MediaConverter,
  },

  // — Everyday · Codes & security —
  {
    id: 'qr-tools',
    name: 'QR generator & scanner',
    blurb: 'Make QR codes with logo embeds, or scan them with the camera.',
    category: 'everyday',
    group: 'security',
    keywords: ['qr', 'code', 'scan', 'camera', 'generator', 'wifi', 'vcard'],
    icon: QrCode,
    status: 'ready',
    component: QrTools,
  },
  {
    id: 'barcode-generator',
    name: 'Barcode generator',
    blurb: 'Print UPC-A/E and Code-128 barcodes for labels and props.',
    category: 'everyday',
    group: 'security',
    keywords: ['barcode', 'upc', 'ean', 'code128', 'label', 'print'],
    icon: Barcode,
    status: 'ready',
    component: BarcodeGenerator,
  },
  {
    id: 'file-encryptor',
    name: 'AES-256 encryptor',
    blurb: 'Password-encrypt files or text with AES-256-GCM, locally.',
    category: 'everyday',
    group: 'security',
    keywords: ['encrypt', 'decrypt', 'aes', 'password', 'secure', 'gcm', 'file'],
    icon: Lock,
    status: 'ready',
    component: FileEncryptor,
  },
  {
    id: 'password-generator',
    name: 'Password generator',
    blurb: 'Generate passwords and passphrases to your own entropy rules.',
    category: 'everyday',
    group: 'security',
    keywords: ['password', 'passphrase', 'generator', 'random', 'entropy', 'diceware', 'secure'],
    icon: KeyRound,
    status: 'ready',
    component: PasswordGenerator,
  },

  // — Everyday · Calculators —
  {
    id: 'loan-calculator',
    name: 'Loan & mortgage calculator',
    blurb: 'Amortization schedule, totals and payoff for any loan.',
    category: 'everyday',
    group: 'calcs',
    keywords: ['loan', 'mortgage', 'amortization', 'interest', 'payment', 'schedule', 'payoff'],
    icon: Landmark,
    status: 'ready',
    component: LoanCalculator,
  },
  {
    id: 'salary-converter',
    name: 'Salary converter',
    blurb: 'Move between annual, monthly, daily and hourly rates.',
    category: 'everyday',
    group: 'calcs',
    keywords: ['salary', 'hourly', 'wage', 'rate', 'annual', 'paycheck', 'convert'],
    icon: Wallet,
    status: 'ready',
    component: SalaryConverter,
  },
  {
    id: 'tip-calculator',
    name: 'Tip & bill splitter',
    blurb: 'Split any bill with tip, per person, in two taps.',
    category: 'everyday',
    group: 'calcs',
    keywords: ['tip', 'bill', 'split', 'restaurant', 'gratuity', 'share', 'per person'],
    icon: Calculator,
    status: 'ready',
    component: TipCalculator,
  },
];

export function getTool(id: string): ToolDefinition | undefined {
  return toolRegistry.find((tool) => tool.id === id);
}

export function getGroup(id: string): ToolGroup | undefined {
  return TOOL_GROUPS.find((group) => group.id === id);
}

export const readyToolCount = toolRegistry.filter((tool) => tool.status === 'ready').length;
