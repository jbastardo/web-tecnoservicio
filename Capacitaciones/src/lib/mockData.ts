import { Training, Participant, Registration, OdooProduct, DashboardMetrics } from "@/types";

export const initialTrainings: Training[] = [
  {
    id: 1,
    name: "Instalación y Configuración Avanzada de Sistemas CCTV IP y NVR",
    code: "CAP-2026-CCTV-01",
    type: "Curso",
    instructor: "Ing. Carlos Mendoza (Especialista Hikvision/Dahua)",
    eventDate: "2026-11-05T13:00:00.000Z", // 9:00 AM America/Caracas
    adStartDate: "2026-10-15T12:00:00.000Z",
    adCosts: 180.0,
    associatedCosts: 120.0, // Refrigerios + Manuales impresos
    maxCapacity: 18,
    instructorCapacity: 1,
    relatedSkus: ["HIK-IP-CAM-2MP", "NVR-4CH-4K", "SWITCH-POE-8P"],
    price: 35.0,
    currency: "USD",
    status: "Cupos Llenos",
    surveyUrl: "https://capacitaciones.onprotec.com/encuesta/1",
    surveyQrCode: "data:image/svg+xml;utf8,<svg>QR_CCTV_01</svg>",
    description: "Formación teórico-práctica con laboratorios en vivo en la sala Onprotec. Protocolos Onvif, configuración de red, analíticas de video y almacenamiento RAID.",
  },
  {
    id: 2,
    name: "Workshop: Redes Ópticas FTTH y Fusionado de Fibra",
    code: "CAP-2026-FTTH-02",
    type: "Workshop",
    instructor: "T.S.U. Roberto González",
    eventDate: "2026-11-12T13:30:00.000Z", // 9:30 AM America/Caracas
    adStartDate: "2026-10-20T12:00:00.000Z",
    adCosts: 220.0,
    associatedCosts: 150.0,
    maxCapacity: 18,
    instructorCapacity: 1,
    relatedSkus: ["FIBRA-DROP-1H", "FUSIONADORA-ARC", "VFL-PEN-10KM"],
    price: 45.0,
    currency: "USD",
    status: "En Publicidad",
    surveyUrl: "https://capacitaciones.onprotec.com/encuesta/2",
    surveyQrCode: null,
    description: "Prácticas de empalme por fusión, conectorización rápida SC/APC y certificación con OTDR.",
  },
  {
    id: 3,
    name: "Certificación Técnica en Control de Acceso Biométrico y Torniquetes",
    code: "CAP-2026-ACC-03",
    type: "Certificación",
    instructor: "Ing. Mariana Silva",
    eventDate: "2026-11-19T13:00:00.000Z",
    adStartDate: "2026-10-22T12:00:00.000Z",
    adCosts: 150.0,
    associatedCosts: 110.0,
    maxCapacity: 18,
    instructorCapacity: 1,
    relatedSkus: ["ZK-FACEPASS-7", "CERRADURA-MAG-600", "BOTON-NO-TOUCH"],
    price: 50.0,
    currency: "USD",
    status: "Planificado",
    surveyUrl: "https://capacitaciones.onprotec.com/encuesta/3",
    surveyQrCode: null,
    description: "Integración con software de asistencia, enrolamiento facial y protocolos Wiegand.",
  },
];

export const initialParticipants: Participant[] = [
  {
    id: 1,
    name: "Alejandro Pérez",
    docType: "V",
    docNumber: "18456123",
    phone: "+584121234567",
    email: "aperez@tecnosolutions.com",
    hasStorePurchases: true,
    storePurchasesAmount: 1450.0,
    company: "TecnoSolutions C.A.",
  },
  {
    id: 2,
    name: "Gabriela Morales",
    docType: "V",
    docNumber: "20987345",
    phone: "+584149876543",
    email: "gaby.seguridad@gmail.com",
    hasStorePurchases: false, // Prospecto sin compras previas
    storePurchasesAmount: 0.0,
    company: "Instalaciones G&M",
  },
  {
    id: 3,
    name: "David Rondón",
    docType: "V",
    docNumber: "16321987",
    phone: "+584245558899",
    email: "drondon@redesmodernas.com",
    hasStorePurchases: true,
    storePurchasesAmount: 3200.0,
    company: "Redes Modernas",
  },
  {
    id: 4,
    name: "Marcos Quintero",
    docType: "V",
    docNumber: "22145678",
    phone: "+584164441122",
    email: "marcosq@gmail.com",
    hasStorePurchases: false, // Prospecto recurrente a cursos sin comprar
    storePurchasesAmount: 0.0,
    company: "Independiente",
  },
  {
    id: 5,
    name: "Patricia Briceño",
    docType: "V",
    docNumber: "19876543",
    phone: "+584123337788",
    email: "pbriceno@seguritas.com",
    hasStorePurchases: true,
    storePurchasesAmount: 890.0,
    company: "Seguridad Integral PB",
  },
];

export const initialRegistrations: Registration[] = [
  {
    id: 1,
    trainingId: 1,
    participantId: 1,
    status: "Confirmado",
    confirmationDate: "2026-11-04T14:00:00.000Z",
    amount: 35.0,
    currency: "USD",
    isPaid: true,
    paymentDate: "2026-10-25T15:20:00.000Z",
    paymentMethod: "Pabilo",
    paymentReference: "PAB-884920",
    pabiloTransactionId: "tx_pab_99182371",
    pabiloStatus: "approved",
    invoiceNumber: "FAC-001942",
    paymentProofUrl: "https://capacitaciones.onprotec.com/proofs/proof-1.jpg",
    specialNotes: "Requiere factura a nombre de TecnoSolutions C.A.",
    reminderSentAt: "2026-11-04T14:05:00.000Z",
    surveySentAt: null,
    checkInAt: null,
  },
  {
    id: 2,
    trainingId: 1,
    participantId: 2,
    status: "Confirmado",
    confirmationDate: "2026-11-04T15:00:00.000Z",
    amount: 35.0,
    currency: "USD",
    isPaid: true,
    paymentDate: "2026-10-26T10:15:00.000Z",
    paymentMethod: "Pabilo",
    paymentReference: "PAB-885012",
    pabiloTransactionId: "tx_pab_99183490",
    pabiloStatus: "approved",
    invoiceNumber: "NE-000845",
    paymentProofUrl: "https://capacitaciones.onprotec.com/proofs/proof-2.jpg",
    specialNotes: null,
    reminderSentAt: "2026-11-04T15:05:00.000Z",
    surveySentAt: null,
    checkInAt: null,
  },
  {
    id: 3,
    trainingId: 1,
    participantId: 3,
    status: "Inscrito",
    confirmationDate: null,
    amount: 35.0,
    currency: "USD",
    isPaid: false,
    paymentDate: null,
    paymentMethod: "Transferencia Bancaria",
    paymentReference: "TRANSF-019827",
    pabiloTransactionId: null,
    pabiloStatus: "pending",
    invoiceNumber: null,
    paymentProofUrl: "https://capacitaciones.onprotec.com/proofs/proof-3.jpg",
    specialNotes: "Comprobante en revisión de conciliación.",
    reminderSentAt: null,
    surveySentAt: null,
    checkInAt: null,
  },
  {
    id: 4,
    trainingId: 1,
    participantId: 4,
    status: "Lista de Espera",
    confirmationDate: null,
    amount: 35.0,
    currency: "USD",
    isPaid: false,
    paymentDate: null,
    paymentMethod: null,
    paymentReference: null,
    pabiloTransactionId: null,
    pabiloStatus: "pending",
    invoiceNumber: null,
    paymentProofUrl: null,
    specialNotes: "Cupo #19 generado en lista de espera al completarse los 18 lugares.",
    reminderSentAt: null,
    surveySentAt: null,
    checkInAt: null,
  },
];

export const initialOdooSkus: OdooProduct[] = [
  {
    id: 1,
    odooId: 101,
    sku: "HIK-IP-CAM-2MP",
    name: "Cámara IP Tubo Hikvision 2MP IR 30m PoE IP67",
    listPrice: 38.5,
    qtyAvailable: 45,
    category: "CCTV / Cámaras IP",
    lastSyncAt: "2026-10-26T14:00:00.000Z",
  },
  {
    id: 2,
    odooId: 102,
    sku: "NVR-4CH-4K",
    name: "Grabador NVR Hikvision 4 Canales 4K 1 bahía SATA",
    listPrice: 85.0,
    qtyAvailable: 18,
    category: "CCTV / Grabadores",
    lastSyncAt: "2026-10-26T14:00:00.000Z",
  },
  {
    id: 3,
    odooId: 103,
    sku: "SWITCH-POE-8P",
    name: "Switch PoE+ no administrable 8 puertos 10/100 Mbps",
    listPrice: 52.0,
    qtyAvailable: 24,
    category: "Networking",
    lastSyncAt: "2026-10-26T14:00:00.000Z",
  },
  {
    id: 4,
    odooId: 104,
    sku: "FIBRA-DROP-1H",
    name: "Bobina Cable Fibra Óptica Drop 1 Hilo G657A1 1000m",
    listPrice: 65.0,
    qtyAvailable: 30,
    category: "Fibra Óptica",
    lastSyncAt: "2026-10-26T14:00:00.000Z",
  },
  {
    id: 5,
    odooId: 105,
    sku: "ZK-FACEPASS-7",
    name: "Terminal de Control de Asistencia y Acceso Biométrico Facial",
    listPrice: 195.0,
    qtyAvailable: 12,
    category: "Control de Acceso",
    lastSyncAt: "2026-10-26T14:00:00.000Z",
  },
];

export const mockDashboardMetrics: DashboardMetrics = {
  // 1. Tasa de Asistencia vs. Inscripción
  attendanceRate: {
    totalRegistered: 35,
    totalConfirmed: 20,
    totalAttended: 16,
    totalNoShow: 4,
    noShowRatePercent: 20.0, // 4 de 20 confirmados no se presentaron (20% no-show)
    attendanceRatePercent: 80.0, // 16 de 20 confirmados asistieron (80% asistencia efectiva)
  },

  // 2. ROI de Capacitación
  roiMetrics: {
    totalRevenue: 1225.0, // 35 cupos x $35 aprox
    totalAdCosts: 330.0, // Costos de Publicidad
    totalAssociatedCosts: 270.0, // Refrigerios + Logística
    totalCosts: 600.0, // Costos Totales ($600)
    netProfit: 625.0, // Ganancia Neta ($625)
    roiPercent: 104.16, // ROI = +104.2%
  },

  // 3. Mapa de Fidelización
  fidelizationMap: {
    totalParticipants: 48,
    storeClientsCount: 28, // Clientes existentes de tienda Onprotec
    prospectsCount: 20, // Nuevos prospectos atraídos por las capacitaciones
    prospectConversionOpportunityPercent: 41.67, // 41.7% son prospectos vírgenes para ventas cruzadas de hardware
    recurringParticipantsCount: 14, // Han venido a más de 1 curso
    recurringWithoutPurchasesPercent: 28.57, // Asistentes recurrentes que aún no compran productos en tienda
  },

  // 4. Estado de Pagos
  paymentStatus: {
    totalBilledExpected: 1450.0,
    totalCollectedPabilo: 980.0, // Validados y conciliados automáticamente por Pabilo
    totalCollectedManual: 280.0, // Transferencias o efectivo en caja
    totalPending: 190.0, // Pendientes por cobrar o validar
    pabiloApprovedCount: 28,
    pendingCount: 5,
  },
};
