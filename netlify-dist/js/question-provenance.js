// TPI 1 provenance research, 2026-10-19. Only matches with confidence >= 75%.
// Identification of origin is not independent clinical validation of an answer key.
const QuestionProvenance = (() => {
  const sources = {
  "tpi-2026-2-tpi1-001": {
    "institution": "SURCE",
    "year": 2018,
    "question": 80,
    "source": "https://www.resmedceara.ufc.br/ares/wp-content/uploads/2017/11/PROVA-ACESSO-DIRETO.pdf",
    "type": "PDF oficial — trecho indexado; download indisponível",
    "confidence": 95,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-002": {
    "institution": "PUC-RS",
    "year": 2021,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Adolescente-sexo83134daff4/",
    "type": "Banco de questões e reprodução institucional com crédito de origem",
    "confidence": 88,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-003": {
    "institution": "UNITAU",
    "year": 2026,
    "question": 30,
    "source": "https://cdn.medblog.estrategiaeducacional.com.br/wp-content/uploads/2025/10/prova-acesso-direto.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-004": {
    "institution": "UNESP",
    "year": 2019,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Mulher-32-anos76a36cd13d/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-005": {
    "institution": "UERJ",
    "year": 2024,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Mulher-50-anos40fee01eed/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-006": {
    "institution": "SURCE",
    "year": 2024,
    "question": 34,
    "source": "https://med.estrategia.com/portal/wp-content/uploads/2023/11/PROVA-ACESSO-DIRETO.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-007": {
    "institution": "UERJ",
    "year": 2025,
    "question": 14,
    "source": "https://cdn.medblog.estrategiaeducacional.com.br/wp-content/uploads/2024/12/ad.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-008": {
    "institution": "Hospital Felício Rocho",
    "year": 2019,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/paciente-46-anos-idade1168f2bda06/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-009": {
    "institution": "UNICAMP",
    "year": 2016,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Mulher-22a-previamente102f8beb447/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "ADAPTADA",
    "official": false
  },
  "tpi-2026-2-tpi1-010": {
    "institution": "HPEV",
    "year": 2023,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Mulher-40-anos-idade88752ad2be/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-011": {
    "institution": "USP-RP",
    "year": 2026,
    "question": 39,
    "source": "https://extranet.hcrp.usp.br/novorh/arquivos/3234/E32342011202518298.pdf",
    "type": "PDF oficial — documento consultado",
    "confidence": 98,
    "relation": "QUASE IDÊNTICA",
    "official": true
  },
  "tpi-2026-2-tpi1-012": {
    "institution": "FAMEMA",
    "year": 2021,
    "question": 5,
    "source": "https://cdn.cebraspe.org.br/concursos/FAMEMA_21_RESIDENCIA/arquivos/557_FAMEMA_002_00.PDF",
    "type": "PDF oficial — documento consultado",
    "confidence": 98,
    "relation": "QUASE IDÊNTICA",
    "official": true
  },
  "tpi-2026-2-tpi1-013": {
    "institution": "UNICAMP",
    "year": 2016,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Homem-53a-com-queixa941e25e384/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-015": {
    "institution": "PUC-RS",
    "year": 2023,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Menino-8-anos-foi753fc6d6d6/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-017": {
    "institution": "FAMERP",
    "year": 2024,
    "question": 67,
    "source": "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2023/12/27182451/famerp___sp_2024_objetiva.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-018": {
    "institution": "Hospital Israelita Albert Einstein",
    "year": 2025,
    "question": 13,
    "source": "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2024/10/21183410/MEDWAY-einstein___sp_2025_objetivaR1.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-019": {
    "institution": "UNIFESP",
    "year": 2021,
    "question": 60,
    "source": "https://storage.googleapis.com/imgs.medway.com.br/2020/12/a47b54b8-prova-objetiva-residencia-medica-unifesp-2021.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-020": {
    "institution": "SURCE",
    "year": 2024,
    "question": 24,
    "source": "https://med.estrategia.com/portal/wp-content/uploads/2023/11/PROVA-ACESSO-DIRETO.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-021": {
    "institution": "USP-SP",
    "year": 2025,
    "question": 71,
    "source": "https://www.fuvest.br/wp-content/uploads/2024-12-01_rm2025_prova-especialidadesclinicas_grupo-b.pdf",
    "type": "PDF oficial — documento consultado",
    "confidence": 98,
    "relation": "QUASE IDÊNTICA",
    "official": true
  },
  "tpi-2026-2-tpi1-022": {
    "institution": "FMJ",
    "year": 2024,
    "question": 84,
    "source": "https://med.estrategia.com/public/questoes/Arthur-32-anos-idade135b76d195e/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "ADAPTADA",
    "official": false
  },
  "tpi-2026-2-tpi1-023": {
    "institution": "UERJ",
    "year": 2020,
    "question": 3,
    "source": "https://med.estrategia.com/public/questoes/Idoso-74-anos-com109acd3dac9/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-024": {
    "institution": "UNIFESP",
    "year": 2026,
    "question": 64,
    "source": "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2025/12/01124509/UNIFESP-SP-2026-Objetiva.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-025": {
    "institution": "USP-SP",
    "year": 2019,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Mulher-45-anos-vem-a107e82e8547/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-026": {
    "institution": "SURCE",
    "year": 2021,
    "question": 28,
    "source": "https://med.estrategia.com/public/questoes/Homem-70-anos8087b7bcee/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-028": {
    "institution": "USP-RP",
    "year": 2025,
    "question": 32,
    "source": "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2024/11/22162639/USP-RP-2025-Objetiva.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-031": {
    "institution": "UNICAMP",
    "year": 2019,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Mulher-57a-relata135cd89806f/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-032": {
    "institution": "HCPA",
    "year": 2023,
    "question": 80,
    "source": "https://fundmed.org.br/website/wp-content/uploads/2024/04/2023-HCPA-Residencia-Medica-Acesso-Direto.pdf",
    "type": "PDF oficial — documento consultado",
    "confidence": 98,
    "relation": "QUASE IDÊNTICA",
    "official": true
  },
  "tpi-2026-2-tpi1-033": {
    "institution": "SURCE",
    "year": 2021,
    "question": 25,
    "source": "https://med.estrategia.com/public/questoes/mulher-27-anos-vitima117841497b6/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-035": {
    "institution": "UFES",
    "year": 2019,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Paciente-sexo899fd8d10b/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-036": {
    "institution": "UFRJ",
    "year": 2022,
    "question": 37,
    "source": "https://med.estrategia.com/public/questoes/Homem-66-anos775a286fa7/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-037": {
    "institution": "UNESP",
    "year": 2023,
    "question": 26,
    "source": "https://med.estrategia.com/public/questoes/Homem-76-anos749a08e70e/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-038": {
    "institution": "UNIRG",
    "year": 2023,
    "question": 17,
    "source": "https://www.unirg.edu.br/arquivos/documentos/Vestibular/multiprofissional/RESIDENCIA%20MULTIPROFISSIONAL%20-%20MEDICINA%20T1.pdf",
    "type": "PDF oficial — documento consultado",
    "confidence": 98,
    "relation": "QUASE IDÊNTICA",
    "official": true
  },
  "tpi-2026-2-tpi1-039": {
    "institution": "USP-SP",
    "year": 2019,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Homem-62-anos-com13565cdc8f9/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-040": {
    "institution": "HCPA",
    "year": 2023,
    "question": 52,
    "source": "https://fundmed.org.br/website/wp-content/uploads/2024/04/2023-HCPA-Residencia-Medica-Acesso-Direto.pdf",
    "type": "PDF oficial — documento consultado",
    "confidence": 98,
    "relation": "QUASE IDÊNTICA",
    "official": true
  },
  "tpi-2026-2-tpi1-042": {
    "institution": "UNICAMP",
    "year": 2014,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Homem-62a-com74117dc1fa/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-043": {
    "institution": "FMABC",
    "year": 2017,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/paciente-36-anos-sexo42fb908894/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-044": {
    "institution": "UNESP",
    "year": 2021,
    "question": 68,
    "source": "https://storage.googleapis.com/imgs.medway.com.br/2021/01/986b9ad3-prova-objetiva-residencia-medica-unesp-2021.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-048": {
    "institution": "UNICAMP",
    "year": 2017,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Mulher-50a-vem-centro138651927f7/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-049": {
    "institution": "PSU-MG",
    "year": 2017,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/paciente-35-anos82f551abe9/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-050": {
    "institution": "CERMAM",
    "year": 2023,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Paciente-22-anos-Gesta49904fd769/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-051": {
    "institution": "Hospital Infantil Sabará",
    "year": 2020,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Mulher-65-anos619edb07cf/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "ADAPTADA",
    "official": false
  },
  "tpi-2026-2-tpi1-053": {
    "institution": "PSU-MG",
    "year": 2017,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Paciente-G3P2A0-3476eec78709/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-054": {
    "institution": "FAMERP",
    "year": 2024,
    "question": 42,
    "source": "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2023/12/27182451/famerp___sp_2024_objetiva.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-056": {
    "institution": "UNESP",
    "year": 2019,
    "question": 33,
    "source": "https://med.estrategia.com/public/questoes/Mulher-67-anos-com642060556d/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-060": {
    "institution": "SURCE",
    "year": 2018,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Mulher-28-anos79fe5b9985/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-061": {
    "institution": "SES-DF",
    "year": 2024,
    "question": 75,
    "source": "https://arquivos.qconcursos.com/prova/arquivo_prova/137048/iades-2023-ses-df-residencia-grupo-1-acesso-direto-prova.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-062": {
    "institution": "FAMERP",
    "year": 2025,
    "question": 21,
    "source": "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2024/11/29145656/FAMERP-2025-Objetiva.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-064": {
    "institution": "PUC-RS",
    "year": 2022,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Primigesta-17-anos-IG1074f2ccdd1/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-065": {
    "institution": "AUSTA",
    "year": 2019,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Mulher-76-anos745d0cb263/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-067": {
    "institution": "AMRIGS",
    "year": 2026,
    "question": 11,
    "source": "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2025/11/26121242/AMRIGS-prova-GO.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-068": {
    "institution": "Hospital Israelita Albert Einstein",
    "year": 2024,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Jessica-23-anos717ef17c3a/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-069": {
    "institution": "FAMEMA",
    "year": 2019,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/gestante-40-anos588eb8a377/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-071": {
    "institution": "CEREM-MS",
    "year": 2016,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/gestante-com-gestaca517f4f730a/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-073": {
    "institution": "UFRJ",
    "year": 2019,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Recem-nascido-termo5986563e07/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-074": {
    "institution": "USP-RP",
    "year": 2026,
    "question": 35,
    "source": "https://extranet.hcrp.usp.br/novorh/arquivos/3234/E32342011202518298.pdf",
    "type": "PDF oficial — documento consultado",
    "confidence": 98,
    "relation": "QUASE IDÊNTICA",
    "official": true
  },
  "tpi-2026-2-tpi1-075": {
    "institution": "CERMAM",
    "year": 2026,
    "question": 72,
    "source": "https://cermam.com.br/wp-content/uploads/2025/11/PROVAO_2026_1_impressao.pdf",
    "type": "PDF oficial — documento consultado",
    "confidence": 98,
    "relation": "QUASE IDÊNTICA",
    "official": true
  },
  "tpi-2026-2-tpi1-076": {
    "institution": "UFRJ",
    "year": 2023,
    "question": 61,
    "source": "https://med.estrategia.com/public/questoes/Menino-4-anos756bce22c9/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-077": {
    "institution": "UniEvangélica",
    "year": 2022,
    "question": null,
    "source": "https://pt.scribd.com/document/1068197550/21-Asma",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-078": {
    "institution": "UNITAU",
    "year": 2026,
    "question": 51,
    "source": "https://cdn.medblog.estrategiaeducacional.com.br/wp-content/uploads/2025/10/prova-acesso-direto.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-080": {
    "institution": "USP-SP",
    "year": 2020,
    "question": 96,
    "source": "https://med.estrategia.com/public/questoes/Recem-nascido109435ac5a1/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-081": {
    "institution": "UFMT",
    "year": 2022,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/lactente-6-meses-sexo862624b27e/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-084": {
    "institution": "Hospital Israelita Albert Einstein",
    "year": 2022,
    "question": 43,
    "source": "https://med.estrategia.com/public/questoes/Recem-nascido-sexo67b3ba475e/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-087": {
    "institution": "UERJ",
    "year": 2021,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Menina-4-anos-e-levada114e80b6a3b/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-088": {
    "institution": "SURCE",
    "year": 2024,
    "question": 43,
    "source": "https://med.estrategia.com/portal/wp-content/uploads/2023/11/PROVA-ACESSO-DIRETO.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-089": {
    "institution": "FAMERP",
    "year": 2025,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Paciente-masculino-12104532b5af7/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-090": {
    "institution": "UNICAMP",
    "year": 2021,
    "question": 71,
    "source": "https://med.estrategia.com/public/questoes/Mulher-26a-procurou9928a4708e/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-091": {
    "institution": "FAMERP",
    "year": 2024,
    "question": 1,
    "source": "https://site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/2023/12/27182451/famerp___sp_2024_objetiva.pdf",
    "type": "PDF de prova/reprodução hospedado por terceiro",
    "confidence": 94,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-092": {
    "institution": "FAMERP",
    "year": 2022,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Paciente-feminina-83975ec8fa3f/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-093": {
    "institution": "UNESP",
    "year": 2019,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/estudo-foi-conduzido77ce86f3d6/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-095": {
    "institution": "SURCE",
    "year": 2020,
    "question": 6,
    "source": "https://med.estrategia.com/public/questoes/paciente-com-35-anos1086b18d3b6/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-096": {
    "institution": "HPEV",
    "year": 2023,
    "question": null,
    "source": "https://med.estrategia.com/public/questoes/Voce-e-acionado-para1062f7e33a0/",
    "type": "Banco de questões — fonte secundária",
    "confidence": 85,
    "relation": "QUASE IDÊNTICA",
    "official": false
  },
  "tpi-2026-2-tpi1-098": {
    "institution": "CERMAM",
    "year": 2026,
    "question": 81,
    "source": "https://cermam.com.br/wp-content/uploads/2025/11/PROVAO_2026_1_impressao.pdf",
    "type": "PDF oficial — documento consultado",
    "confidence": 98,
    "relation": "QUASE IDÊNTICA",
    "official": true
  },
  "tpi-2026-2-tpi1-100": {
    "institution": "HCPA",
    "year": 2023,
    "question": 100,
    "source": "https://fundmed.org.br/website/wp-content/uploads/2024/04/2023-HCPA-Residencia-Medica-Acesso-Direto.pdf",
    "type": "PDF oficial — documento consultado",
    "confidence": 98,
    "relation": "QUASE IDÊNTICA",
    "official": true
  }
};
  function get(question) { return sources[question && question.id] || null; }
  function render(question, container) {
    if (!container) return;
    container.replaceChildren();
    if (!question || !/^tpi-2026-2-tpi1-/.test(question.id || '')) return;
    const source = get(question);
    if (!source) {
      const label = document.createElement('p');
      label.className = 'question-provenance-unknown';
      label.textContent = 'Prova-mãe não identificada';
      container.append(label);
      return;
    }
    const detail = document.createElement('details');
    detail.className = 'question-provenance';
    const summary = document.createElement('summary');
    summary.textContent = 'Prova-mãe: ' + source.institution + ' · ' + source.year;
    const info = document.createElement('p');
    info.textContent = (source.question ? 'Questão original ' + source.question + ' · ' : '') + source.relation.toLocaleLowerCase('pt-BR') + ' · Confiança ' + source.confidence + '%.';
    const caveat = document.createElement('p');
    caveat.textContent = source.official ? 'Correspondência com documento oficial consultado.' : 'Identificação apoiada em reprodução ou trecho indexado; não confirmada em documento oficial integral.';
    const link = document.createElement('a');
    link.href = source.source;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Consultar fonte';
    detail.append(summary, info, caveat, link);
    container.append(detail);
  }
  return Object.freeze({ get, render });
})();
