import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const today = (() => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = new Map(parts.map((p) => [p.type, p.value]));
  return `${map.get("year")}-${map.get("month")}-${map.get("day")}`;
})();

const yesterday = (() => {
  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
})();

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main() {
  const categoryData: [string, number][] = [
    ["Malzeme", 0],
    ["Personel", 1],
    ["Kira", 2],
    ["Fatura", 3],
    ["Vergi", 4],
    ["Ulaşım", 5],
    ["Diğer", 6],
  ];

  await Promise.all(
    categoryData.map(([name, sortOrder], index) =>
      prisma.expenseCategory.upsert({
        where: { id: `seed-kategori-${index + 1}` },
        update: { name, sortOrder },
        create: { id: `seed-kategori-${index + 1}`, name, sortOrder },
      }),
    ),
  );

  await prisma.account.upsert({
    where: { id: "seed-kasa" },
    update: { name: "Kasa", type: "cash", openingBalanceKurus: 50_000_00 },
    create: {
      id: "seed-kasa",
      name: "Kasa",
      type: "cash",
      openingBalanceKurus: 50_000_00,
      sortOrder: 0,
    },
  });

  const serviceData: [string, string, number][] = [
    ["Kombi bakımı", "adet", 60_000],
    ["Priz değişimi", "adet", 15_000],
    ["Avize montajı", "adet", 45_000],
    ["Sigorta paneli değişimi", "adet", 80_000],
    ["Kablo döşeme", "metre", 4_500],
    ["Termostat montajı", "adet", 35_000],
    ["Genel elektrik kontrolü", "adet", 50_000],
    ["İşçilik", "saat", 50_000],
  ];

  await Promise.all(
    serviceData.map(([name, unit, unitPriceKurus], index) =>
      prisma.serviceItem.upsert({
        where: { id: `seed-hizmet-${index + 1}` },
        update: { name, unit, unitPriceKurus, sortOrder: index },
        create: {
          id: `seed-hizmet-${index + 1}`,
          name,
          unit,
          unitPriceKurus,
          sortOrder: index,
        },
      }),
    ),
  );

  const customerData: [string, string, string | null][] = [
    ["Ahmet Usta", "0555 111 22 33", null],
    ["Aylin Hanım", "0555 222 33 44", "Yeni taşındı"],
    ["Mehmet Bey", "0555 333 44 55", null],
    ["Zeynep Hanım", "0555 444 55 66", "Dükkan sahibi"],
    ["Hüseyin Bey", "0555 555 66 77", null],
  ];

  await Promise.all(
    customerData.map(([name, phone, notes], index) =>
      prisma.customer.upsert({
        where: { id: `seed-musteri-${index + 1}` },
        update: { name, phone, notes },
        create: { id: `seed-musteri-${index + 1}`, name, phone, notes },
      }),
    ),
  );

  await prisma.job.upsert({
    where: { id: "seed-is-1" },
    update: {},
    create: {
      id: "seed-is-1",
      customerId: "seed-musteri-1",
      title: "Kombi bakımı",
      description: "Yıllık bakım ve filtre temizliği",
      status: "pending",
      priceKurus: 60_000,
      scheduledOn: dateOnly(today),
      startTime: "14:30",
    },
  });

  await prisma.job.upsert({
    where: { id: "seed-is-2" },
    update: {},
    create: {
      id: "seed-is-2",
      customerId: "seed-musteri-2",
      title: "Priz değişimi",
      description: "Salondaki yanık prizlerin değişimi",
      status: "planned",
      priceKurus: 15_000,
      scheduledOn: dateOnly(today),
      startTime: "16:00",
    },
  });

  await prisma.job.upsert({
    where: { id: "seed-is-3" },
    update: {},
    create: {
      id: "seed-is-3",
      customerId: "seed-musteri-3",
      title: "Avize montajı",
      description: "Salon avizesi montajı",
      status: "completed",
      priceKurus: 45_000,
      scheduledOn: dateOnly(today),
      startTime: "18:30",
      completedOn: dateOnly(today),
    },
  });

  await prisma.job.upsert({
    where: { id: "seed-is-4" },
    update: {},
    create: {
      id: "seed-is-4",
      customerId: "seed-musteri-4",
      title: "Sigorta paneli değişimi",
      description: "Eski pano yenilendi",
      status: "completed",
      priceKurus: 80_000,
      scheduledOn: dateOnly(yesterday),
      startTime: "10:00",
      completedOn: dateOnly(yesterday),
    },
  });

  await prisma.revenue.upsert({
    where: { id: "seed-gelir-1" },
    update: {},
    create: {
      id: "seed-gelir-1",
      date: dateOnly(today),
      amountKurus: 60_000,
      description: "Kombi bakımı ücreti",
      paid: true,
      customerId: "seed-musteri-1",
      jobId: "seed-is-1",
      accountId: "seed-kasa",
    },
  });

  await prisma.cashMovement.upsert({
    where: { id: "seed-hareket-1" },
    update: {},
    create: {
      id: "seed-hareket-1",
      accountId: "seed-kasa",
      type: "income",
      amountKurus: 60_000,
      date: dateOnly(today),
      description: "Kombi bakımı ücreti",
      revenueId: "seed-gelir-1",
    },
  });

  await prisma.revenue.upsert({
    where: { id: "seed-gelir-2" },
    update: {},
    create: {
      id: "seed-gelir-2",
      date: dateOnly(today),
      amountKurus: 45_000,
      description: "Avize montajı ücreti",
      paid: true,
      customerId: "seed-musteri-3",
      jobId: "seed-is-3",
      accountId: "seed-kasa",
    },
  });

  await prisma.cashMovement.upsert({
    where: { id: "seed-hareket-2" },
    update: {},
    create: {
      id: "seed-hareket-2",
      accountId: "seed-kasa",
      type: "income",
      amountKurus: 45_000,
      date: dateOnly(today),
      description: "Avize montajı ücreti",
      revenueId: "seed-gelir-2",
    },
  });

  await prisma.revenue.upsert({
    where: { id: "seed-gelir-3" },
    update: {},
    create: {
      id: "seed-gelir-3",
      date: dateOnly(yesterday),
      amountKurus: 80_000,
      description: "Sigorta paneli değişimi",
      paid: false,
      customerId: "seed-musteri-4",
      jobId: "seed-is-4",
    },
  });

  await prisma.receivable.upsert({
    where: { id: "seed-alacak-1" },
    update: {},
    create: {
      id: "seed-alacak-1",
      customerId: "seed-musteri-4",
      description: "Sigorta paneli değişimi",
      totalKurus: 80_000,
      dueDate: dateOnly(today),
      source: "job",
      jobId: "seed-is-4",
      revenueId: "seed-gelir-3",
    },
  });

  await prisma.receivable.upsert({
    where: { id: "seed-alacak-2" },
    update: {},
    create: {
      id: "seed-alacak-2",
      customerId: "seed-musteri-5",
      description: "Dükkan tadilat işçiliği",
      totalKurus: 120_000,
      dueDate: dateOnly(yesterday),
      source: "manual",
    },
  });

  await prisma.receivable.upsert({
    where: { id: "seed-alacak-3" },
    update: {},
    create: {
      id: "seed-alacak-3",
      customerId: "seed-musteri-2",
      description: "Eski borç",
      totalKurus: 30_000,
      source: "manual",
    },
  });

  await prisma.collection.upsert({
    where: { id: "seed-tahsilat-1" },
    update: {},
    create: {
      id: "seed-tahsilat-1",
      receivableId: "seed-alacak-3",
      amountKurus: 10_000,
      date: dateOnly(today),
      accountId: "seed-kasa",
    },
  });

  await prisma.cashMovement.upsert({
    where: { id: "seed-hareket-3" },
    update: {},
    create: {
      id: "seed-hareket-3",
      accountId: "seed-kasa",
      type: "collection",
      amountKurus: 10_000,
      date: dateOnly(today),
      description: "Eski borç",
      collectionId: "seed-tahsilat-1",
    },
  });

  await prisma.expense.upsert({
    where: { id: "seed-gider-1" },
    update: {},
    create: {
      id: "seed-gider-1",
      date: dateOnly(yesterday),
      amountKurus: 25_000,
      description: "Sigorta paneli malzemesi",
      categoryId: "seed-kategori-1",
      jobId: "seed-is-4",
      accountId: "seed-kasa",
    },
  });

  await prisma.cashMovement.upsert({
    where: { id: "seed-hareket-4" },
    update: {},
    create: {
      id: "seed-hareket-4",
      accountId: "seed-kasa",
      type: "expense",
      amountKurus: 25_000,
      date: dateOnly(yesterday),
      description: "Sigorta paneli malzemesi",
      expenseId: "seed-gider-1",
    },
  });

  await prisma.expense.upsert({
    where: { id: "seed-gider-2" },
    update: {},
    create: {
      id: "seed-gider-2",
      date: dateOnly(today),
      amountKurus: 120_000,
      description: "Dükkan kirası",
      categoryId: "seed-kategori-3",
      accountId: "seed-kasa",
    },
  });

  await prisma.cashMovement.upsert({
    where: { id: "seed-hareket-5" },
    update: {},
    create: {
      id: "seed-hareket-5",
      accountId: "seed-kasa",
      type: "expense",
      amountKurus: 120_000,
      date: dateOnly(today),
      description: "Dükkan kirası",
      expenseId: "seed-gider-2",
    },
  });

  await prisma.cashMovement.upsert({
    where: { id: "seed-hareket-6" },
    update: {},
    create: {
      id: "seed-hareket-6",
      accountId: "seed-kasa",
      type: "manual_in",
      amountKurus: 20_000,
      date: dateOnly(yesterday),
      description: "Kasaya elden konan para",
    },
  });

  await prisma.quote.upsert({
    where: { id: "seed-teklif-1" },
    update: {},
    create: {
      id: "seed-teklif-1",
      customerId: "seed-musteri-5",
      title: "Dükkan tadilatı",
      status: "draft",
      validUntil: dateOnly(today),
    },
  });

  await prisma.quoteItem.upsert({
    where: { id: "seed-teklif-1-kalem-1" },
    update: {},
    create: {
      id: "seed-teklif-1-kalem-1",
      quoteId: "seed-teklif-1",
      name: "Kablo döşeme",
      unit: "metre",
      quantity: 20,
      unitPriceKurus: 4_500,
      sortOrder: 0,
    },
  });

  await prisma.quoteItem.upsert({
    where: { id: "seed-teklif-1-kalem-2" },
    update: {},
    create: {
      id: "seed-teklif-1-kalem-2",
      quoteId: "seed-teklif-1",
      name: "İşçilik",
      unit: "saat",
      quantity: 6,
      unitPriceKurus: 50_000,
      sortOrder: 1,
    },
  });

  await prisma.quote.upsert({
    where: { id: "seed-teklif-2" },
    update: {},
    create: {
      id: "seed-teklif-2",
      customerId: "seed-musteri-1",
      title: "Termostat montajı",
      status: "sent",
    },
  });

  await prisma.quoteItem.upsert({
    where: { id: "seed-teklif-2-kalem-1" },
    update: {},
    create: {
      id: "seed-teklif-2-kalem-1",
      quoteId: "seed-teklif-2",
      name: "Termostat montajı",
      unit: "adet",
      quantity: 1,
      unitPriceKurus: 35_000,
      sortOrder: 0,
    },
  });

  console.log("Seed tamamlandı.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
