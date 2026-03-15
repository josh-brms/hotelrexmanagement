'use client';

import { formatPeso, formatDateTime } from './utils';

// Dynamic import helper for jsPDF
export async function generateReceiptPDF(payment: {
  id: string;
  guestName: string;
  bookingId: string;
  paymentDate: string;
  amountReceived: number;
  paymentMethod: string;
  roomNumber?: string;
  numDays?: number;
  totalAmount?: number;
  balanceDue?: number;
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // Header
  doc.setFillColor(0, 86, 179);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REX HOTEL', 105, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Payment Receipt', 105, 28, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  let y = 55;
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt #: ${payment.id.toUpperCase()}`, 20, y);
  doc.text(`Date: ${formatDateTime(payment.paymentDate)}`, 120, y);

  y += 15;
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Guest Information', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Guest Name: ${payment.guestName}`, 20, y);
  y += 7;
  doc.text(`Booking ID: ${payment.bookingId.toUpperCase()}`, 20, y);
  if (payment.roomNumber) {
    y += 7;
    doc.text(`Room Number: ${payment.roomNumber}`, 20, y);
  }
  if (payment.numDays) {
    y += 7;
    doc.text(`Number of Days: ${payment.numDays}`, 20, y);
  }

  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details', 20, y);
  y += 10;

  // Table-style rows
  const addRow = (label: string, value: string, highlight = false) => {
    if (highlight) {
      doc.setFillColor(0, 86, 179);
      doc.rect(18, y - 5, 174, 10, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 249, 250);
      doc.rect(18, y - 5, 174, 10, 'F');
      doc.setTextColor(0, 0, 0);
    }
    doc.setFont('helvetica', 'normal');
    doc.text(label, 22, y);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 188, y, { align: 'right' });
    y += 12;
  };

  if (payment.totalAmount !== undefined) addRow('Total Room Charge:', formatPeso(payment.totalAmount));
  addRow('Amount Received:', formatPeso(payment.amountReceived));
  addRow('Payment Method:', payment.paymentMethod);
  if (payment.balanceDue !== undefined) {
    addRow('Remaining Balance:', formatPeso(payment.balanceDue), payment.balanceDue > 0);
  }

  y += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('Thank you for staying at Rex Hotel!', 105, y, { align: 'center' });
  y += 7;
  doc.text('This is an official receipt. Please keep for your records.', 105, y, { align: 'center' });

  doc.save(`receipt-${payment.id}.pdf`);
}

export async function generateRecordsPDF(title: string, headers: string[], rows: string[][]) {
  const { jsPDF } = await import('jspdf');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { default: autoTable } = await import('jspdf-autotable') as any;

  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFillColor(0, 86, 179);
  doc.rect(0, 0, 297, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REX HOTEL', 148, 12, { align: 'center' });
  doc.setFontSize(11);
  doc.text(title, 148, 22, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, 14, 38);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 42,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 86, 179] },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}
