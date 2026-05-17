import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode-generator";
import type { Garage, Customer, Invoice, InvoiceItem } from "@/types/database";

export type InvoicePdfInput = {
  garage: Garage;
  invoice: Invoice;
  customer: Customer | null;
  items: InvoiceItem[];
  logoDataUrl?: string | null;
};

function qrAmount(value: number | string | null | undefined) {
  return Number(value ?? 0).toFixed(2);
}

function formatNumber(value: number | string | null | undefined, decimals = 2) {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  const sign = safe < 0 ? "-" : "";
  const fixed = Math.abs(safe).toFixed(decimals);
  const [integer, fraction] = fixed.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return decimals > 0 ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`;
}

function formatAmount(value: number | string | null | undefined) {
  return formatNumber(value, 2);
}

function formatQuantity(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isInteger(n) ? formatNumber(n, 0) : formatNumber(n, 2);
}

function pdfText(value: string | number | null | undefined) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");
}

function qrText(value: string | number | null | undefined) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function countryCode(value: string | null | undefined) {
  const normalized = qrText(value).toLowerCase();
  if (!normalized || normalized === "suisse" || normalized === "schweiz") {
    return "CH";
  }
  if (normalized === "france") return "FR";
  if (normalized === "italie" || normalized === "italia") return "IT";
  if (normalized === "allemagne" || normalized === "deutschland") return "DE";
  return normalized.length === 2 ? normalized.toUpperCase() : "CH";
}

function splitStreetAndHouseNumber(address: string | null | undefined) {
  const value = qrText(address);
  const match = value.match(/^(.*?)[,\s]+(\d+[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)?)$/);

  if (!match) {
    return { street: value, houseNumber: "" };
  }

  return {
    street: match[1].trim(),
    houseNumber: match[2].trim(),
  };
}

function pdfLines(lines: Array<string | null | undefined>) {
  return compact(lines).map(pdfText);
}

function customerName(customer: Customer | null) {
  if (!customer) return "-";
  if (customer.customer_type === "entreprise" && customer.company_name) {
    return customer.company_name;
  }
  return [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "-";
}

function compact(lines: Array<string | null | undefined>) {
  return lines.filter((line): line is string => Boolean(line?.trim()));
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "AZ").toUpperCase();
}

function qrPayload(
  garage: Garage,
  invoice: Invoice,
  customer: Customer | null
) {
  const creditorAddress = splitStreetAndHouseNumber(garage.address);
  const debtorAddress = splitStreetAndHouseNumber(customer?.address);
  const creditorName =
    garage.bank_account_holder || garage.legal_name || garage.name || "";

  return [
    "SPC",
    "0200",
    "1",
    garage.iban || "",
    "S",
    qrText(creditorName),
    qrText(creditorAddress.street),
    qrText(creditorAddress.houseNumber),
    garage.postal_code || "",
    qrText(garage.city),
    countryCode(garage.country),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    qrAmount(invoice.total),
    garage.currency || "CHF",
    customer ? "S" : "",
    customer ? qrText(customerName(customer)) : "",
    customer ? qrText(debtorAddress.street) : "",
    customer ? qrText(debtorAddress.houseNumber) : "",
    customer?.postal_code || "",
    qrText(customer?.city),
    customer ? countryCode(customer.country) : "",
    "NON",
    "",
    qrText(`Facture ${invoice.invoice_number}`),
    "EPD",
    "",
  ].join("\n");
}

function drawGradientHeader(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFillColor(78, 82, 88);
  doc.rect(x, y, w, h, "F");
}

function drawLogoFallback(doc: jsPDF, garage: Garage, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text(pdfText(initials(garage.name)), x, y + 17);
}

function imageFormatFromDataUrl(dataUrl: string) {
  return dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")
    ? "JPEG"
    : "PNG";
}

function fitImage(
  doc: jsPDF,
  dataUrl: string,
  maxWidth: number,
  maxHeight: number
) {
  const props = doc.getImageProperties(dataUrl);
  const ratio = Math.min(maxWidth / props.width, maxHeight / props.height);
  return {
    width: props.width * ratio,
    height: props.height * ratio,
  };
}

function drawBrand(
  doc: jsPDF,
  garage: Garage,
  x: number,
  y: number,
  logoDataUrl?: string | null
) {
  if (logoDataUrl) {
    try {
      const size = fitImage(doc, logoDataUrl, 34, 24);
      doc.addImage(
        logoDataUrl,
        imageFormatFromDataUrl(logoDataUrl),
        x,
        y,
        size.width,
        size.height,
        undefined,
        "FAST"
      );
    } catch {
      drawLogoFallback(doc, garage, x, y);
    }
  } else {
    drawLogoFallback(doc, garage, x, y);
  }

  doc.setTextColor(10, 10, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(pdfText(garage.legal_name || garage.name || "Garage"), x + 44, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Facture de vente de vehicule", x + 44, y + 18);
  doc.setFontSize(9);
  doc.text(
    pdfLines([
      [garage.address, garage.postal_code, garage.city].filter(Boolean).join(" - "),
      [garage.email, garage.website, garage.phone].filter(Boolean).join(" - "),
    ]),
    x + 44,
    y + 25
  );
}

function drawLabelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number
) {
  drawGradientHeader(doc, x, y, w, 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(pdfText(label), x + 1.5, y + 4.4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.setDrawColor(235, 235, 235);
  doc.rect(x, y + 6, w, 9);
  doc.text(pdfText(value || "-"), x + 1.5, y + 12);
}

function drawTextBlock(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  maxLines = 3
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(78, 82, 88);
  doc.text(pdfText(label), x, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  const lines = doc.splitTextToSize(pdfText(value), width).slice(0, maxLines);
  doc.text(lines, x, y + 5);

  return y + 7 + lines.length * 4;
}

function drawPaymentSlip(
  doc: jsPDF,
  garage: Garage,
  invoice: Invoice,
  customer: Customer | null
) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = 205;
  const currency = garage.currency || "CHF";
  const accountHolder = garage.bank_account_holder || garage.legal_name || garage.name;
  const accountLines = pdfLines([
    "Compte / Payable a",
    garage.iban,
    accountHolder,
    garage.address,
    [garage.postal_code, garage.city].filter(Boolean).join(" "),
  ]);
  const payerLines = pdfLines([
    "Payable par",
    customerName(customer),
    customer?.address,
    [customer?.postal_code, customer?.city].filter(Boolean).join(" "),
  ]);

  doc.setDrawColor(130, 130, 130);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(0, y, 210, y);
  doc.line(62, y, 62, pageHeight);
  doc.setLineDashPattern([], 0);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("A detacher avant le versement", 105, y - 2, { align: "center" });

  doc.setFontSize(13);
  doc.text("Recepisse", 8, y + 10);
  doc.text("Section Paiement", 68, y + 10);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(accountLines[0] || "Compte / Payable a", 8, y + 20);
  doc.setFont("helvetica", "normal");
  doc.text(accountLines.slice(1), 8, y + 25);
  doc.setFont("helvetica", "bold");
  doc.text(payerLines[0] || "Payable par", 8, y + 54);
  doc.setFont("helvetica", "normal");
  doc.text(payerLines.slice(1), 8, y + 59);
  doc.setFont("helvetica", "bold");
  doc.text("Monnaie", 8, y + 82);
  doc.text("Montant", 25, y + 82);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(currency, 8, y + 89);
  doc.text(formatAmount(invoice.total), 25, y + 89);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Point de depot", 39, y + 78);

  if (garage.iban) {
    const qr = QRCode(0, "M");
    qr.addData(qrPayload(garage, invoice, customer));
    qr.make();
    doc.addImage(qr.createDataURL(4, 0), "PNG", 68, y + 21, 44, 44);
  } else {
    doc.rect(68, y + 21, 44, 44);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("QR IBAN a configurer", 90, y + 44, { align: "center" });
  }

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Compte / Payable a", 118, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(pdfLines([garage.iban, accountHolder, garage.address, [garage.postal_code, garage.city].filter(Boolean).join(" ")]), 118, y + 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Payable par", 118, y + 58);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(payerLines.slice(1), 118, y + 65);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Monnaie", 68, y + 82);
  doc.text("Montant", 85, y + 82);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(currency, 68, y + 89);
  doc.text(formatAmount(invoice.total), 85, y + 89);
}

export function generateInvoicePdfBlob(data: InvoicePdfInput): Blob {
  const { garage, invoice, customer, items, logoDataUrl } = data;
  const currency = garage.currency || "CHF";
  const paymentTerms = invoice.payment_terms || garage.default_payment_terms || "";
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;

  drawBrand(doc, garage, margin, 12, logoDataUrl);

  let y = 54;
  drawLabelValue(
    doc,
    "Facture vente vehicule",
    `No ${invoice.invoice_number}`,
    margin,
    y,
    55
  );
  drawLabelValue(doc, "Lieu et date", `${garage.city || ""}, le ${invoice.invoice_date}`, margin, y + 18, 55);
  drawLabelValue(doc, "Echeance", invoice.due_date || "-", margin, y + 36, 55);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(
    pdfText(
      `Exp. : ${garage.legal_name || garage.name} a ${compact([garage.postal_code, garage.city]).join(" ")}`
    ),
    118,
    y + 4
  );
  doc.line(118, y + 5.5, 185, y + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    pdfLines([
      customerName(customer),
      customer?.address,
      [customer?.postal_code, customer?.city].filter(Boolean).join(" "),
      customer?.country,
    ]),
    118,
    y + 18
  );

  y += 55;
  drawGradientHeader(doc, margin, y, 55, 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Concerne", margin + 1.5, y + 4.4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 20, 20);
  doc.rect(margin, y + 6, 168, 9);
  doc.text(
    pdfText(`Facture de vente de vehicule ${invoice.invoice_number}`),
    margin + 1.5,
    y + 12
  );

  y += 23;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [
      [
        "Description",
        "Quantite",
        "Unite",
        invoice.amounts_include_vat ? "Prix TTC CHF" : "Prix HT CHF",
        "Total",
      ],
    ],
    body: items.map((it) => {
      const multiplier = invoice.amounts_include_vat
        ? 1 + Number(invoice.vat_rate ?? 0) / 100
        : 1;

      return [
        pdfText(it.description),
        formatQuantity(it.quantity),
        "Bloc",
        formatAmount(Number(it.unit_price) * multiplier),
        formatAmount(Number(it.total) * multiplier),
      ];
    }),
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
      lineWidth: 0,
      textColor: [15, 15, 15],
    },
    headStyles: {
      fillColor: [78, 82, 88],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right", fontStyle: "bold" },
    },
  });

  const docExt = doc as unknown as { lastAutoTable?: { finalY: number } };
  y = (docExt.lastAutoTable?.finalY ?? y + 25) + 4;

  const totalNoVat = Number(invoice.total) - Number(invoice.vat_amount ?? 0);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: 82 },
    tableWidth: 98,
    body: [
      ["Total sans TVA", "Taux TVA", "Total TVA"],
      [
        formatAmount(totalNoVat),
        `${formatNumber(invoice.vat_rate ?? 0, 2)} %`,
        formatAmount(invoice.vat_amount ?? 0),
      ],
      ["No TVA", pdfText(garage.vat_number || "-"), ""],
    ],
    styles: { font: "helvetica", fontSize: 10, cellPadding: 2, lineColor: [230, 230, 235], lineWidth: 0.2 },
    didParseCell: (hook) => {
      if (hook.row.index === 0 || hook.row.index === 2) {
        hook.cell.styles.fillColor = [78, 82, 88];
        hook.cell.styles.textColor = [255, 255, 255];
        hook.cell.styles.fontStyle = "bold";
      }
      if (hook.column.index > 0) hook.cell.styles.halign = "right";
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 29 },
      2: { cellWidth: 29 },
    },
  });

  const totalY = y;
  drawGradientHeader(doc, 126, totalY, 66, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Total a payer", 128, totalY + 5.5);
  doc.text(`${formatAmount(invoice.total)} ${currency}`, 190, totalY + 5.5, {
    align: "right",
  });

  if (y > 158) {
    doc.addPage();
    y = 32;
  } else {
    y = Math.max(y + 34, 164);
  }
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (paymentTerms) {
    y = drawTextBlock(doc, "Conditions de paiement", paymentTerms, margin, y, 166, 2);
  }
  if (invoice.notes) {
    y = drawTextBlock(doc, "Remarques", invoice.notes, margin, y, 166, 2);
  }
  if (y < 194) {
    drawTextBlock(
      doc,
      "Message",
      garage.default_invoice_note ||
        "Nous vous remercions de votre confiance et vous adressons nos meilleures salutations.",
      margin,
      y,
      166,
      1
    );
  }
  drawPaymentSlip(doc, garage, invoice, customer);

  return doc.output("blob");
}
