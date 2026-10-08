import * as XLSX from 'xlsx';
import { Branch } from '../types';

/**
 * Intelligent parser for branches uploaded via Excel or CSV
 */
export async function parseExcelBranches(file: File): Promise<Branch[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  // Get the first sheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('الملف فارغ أو لا يحتوي على صفحات عمل.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('لا توجد بيانات داخل ملف الإكسيل.');
  }

  // Find header row or decide if row 0 is header
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const row = rawRows[i];
    if (Array.isArray(row) && row.some((cell) => cell && typeof cell === 'string')) {
      const rowText = row.join(' ').toLowerCase();
      if (
        rowText.includes('فرع') ||
        rowText.includes('branch') ||
        rowText.includes('عنوان') ||
        rowText.includes('address') ||
        rowText.includes('name') ||
        rowText.includes('اسم')
      ) {
        headerIndex = i;
        break;
      }
    }
  }

  const branches: Branch[] = [];

  // Helper to normalize strings
  const normalize = (str: any) =>
    str ? String(str).trim().toLowerCase().replace(/[\s_-]+/g, '') : '';

  if (headerIndex !== -1) {
    // We have identifiable headers
    const headers: string[] = rawRows[headerIndex].map((h: any) => normalize(h));
    
    // Column indices mapping
    const findColIndex = (...candidates: string[]) => {
      return headers.findIndex((h) => candidates.some((c) => h.includes(normalize(c))));
    };

    const nameCol = findColIndex('اسمفرع', 'اسم_الفرع', 'الفرع', 'branchname', 'branch', 'name', 'اسم');
    const addressCol = findColIndex('عنوان', 'العنوان', 'address', 'موقع', 'street');
    const cityCol = findColIndex('محافظة', 'المحافظة', 'منطقة', 'المنطقة', 'مدينة', 'المدينة', 'city', 'gov', 'governorate', 'area');
    const phoneCol = findColIndex('تليفون', 'هاتف', 'موبايل', 'اتصال', 'phone', 'tel', 'mobile', 'hotline');
    const mapsCol = findColIndex('خريطة', 'خرائط', 'لوكيشن', 'ماب', 'map', 'maps', 'location', 'url', 'gps');

    for (let r = headerIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      const nameVal = nameCol !== -1 ? row[nameCol] : row[0];
      if (!nameVal || String(nameVal).trim() === '') continue;

      const addressVal = addressCol !== -1 ? row[addressCol] : (row[1] || '');
      const cityVal = cityCol !== -1 ? row[cityCol] : (row[2] || '');
      const phoneVal = phoneCol !== -1 ? row[phoneCol] : (row[3] || '');
      const mapsVal = mapsCol !== -1 ? row[mapsCol] : (row[4] || '');

      branches.push({
        id: `branch-imp-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 6)}`,
        name: String(nameVal).trim(),
        address: addressVal ? String(addressVal).trim() : 'غير محدد',
        city: cityVal ? String(cityVal).trim() : undefined,
        phone: phoneVal ? String(phoneVal).trim() : undefined,
        mapsUrl: mapsVal && String(mapsVal).startsWith('http') ? String(mapsVal).trim() : undefined,
        addedAt: new Date().toISOString(),
      });
    }
  } else {
    // No headers detected, fallback positional: Col 0 = Name, Col 1 = Address, Col 2 = City, Col 3 = Phone
    const startRow = typeof rawRows[0]?.[0] === 'string' && rawRows[0][0].length < 30 ? 0 : 1;
    for (let r = startRow; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;
      const nameVal = row[0];
      if (!nameVal || String(nameVal).trim() === '') continue;

      branches.push({
        id: `branch-imp-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 6)}`,
        name: String(nameVal).trim(),
        address: row[1] ? String(row[1]).trim() : 'غير محدد',
        city: row[2] ? String(row[2]).trim() : undefined,
        phone: row[3] ? String(row[3]).trim() : undefined,
        mapsUrl: row[4] && String(row[4]).startsWith('http') ? String(row[4]).trim() : undefined,
        addedAt: new Date().toISOString(),
      });
    }
  }

  return branches;
}

/**
 * Downloads a ready-to-use Arabic Excel template with sample branches
 */
export function downloadExcelTemplate() {
  const sampleData = [
    {
      'اسم الفرع': 'فرع التجمع الخامس - الداون تاون',
      'العنوان بالتفصيل': 'شارع التسعين الجنوبي، داخل داون تاون مول، التجمع الخامس',
      'المحافظة / المنطقة': 'القاهرة',
      'رقم التليفون': '16061',
      'رابط خرائط جوجل': 'https://maps.google.com',
    },
    {
      'اسم الفرع': 'فرع الشيخ زايد - هايبر',
      'العنوان بالتفصيل': 'محور 26 يوليو، مدخل الشيخ زايد 1، بجوار جامعة النيل',
      'المحافظة / المنطقة': 'الجيزة',
      'رقم التليفون': '19890',
      'رابط خرائط جوجل': 'https://maps.google.com',
    },
    {
      'اسم الفرع': 'فرع سيتي سنتر الإسكندرية',
      'العنوان بالتفصيل': 'طريق مصر إسكندرية الصحراوي، محرم بك',
      'المحافظة / المنطقة': 'الإسكندرية',
      'رقم التليفون': '16061',
      'رابط خرائط جوجل': 'https://maps.google.com',
    },
    {
      'اسم الفرع': 'فرع المعادي الجديدة',
      'العنوان بالتفصيل': 'شارع النصر، أمام المركز الأوليمبي، المعادي',
      'المحافظة / المنطقة': 'القاهرة',
      'رقم التليفون': '16508',
      'رابط خرائط جوجل': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 45 },
    { wch: 20 },
    { wch: 18 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج الفروع');

  XLSX.writeFile(workbook, 'نموذج_رفع_فروع_السوبر_ماركت.xlsx');
}

/**
 * Exports current chain branches to a stylized Excel sheet
 */
export function exportBranchesToExcel(branches: Branch[], chainName: string) {
  const data = branches.map((b, idx) => ({
    'م': idx + 1,
    'اسم الفرع': b.name,
    'العنوان': b.address,
    'المحافظة': b.city || 'غير محدد',
    'رقم الهاتف': b.phone || '-',
    'رابط الخريطة': b.mapsUrl || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 45 },
    { wch: 18 },
    { wch: 18 },
    { wch: 35 },
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheetName = chainName.slice(0, 28).replace(/[\\/?*[\]]/g, '');
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName || 'الفروع');

  const safeFileName = `فروع_${chainName.replace(/[\s/\\?%*:|"<>]+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, safeFileName);
}
