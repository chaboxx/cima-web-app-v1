export const doctors = [
  'Nayla Medrano Cabrera',
  'Julio Llalicuna Quiñones',
  'Flavia Infantas Velarde',
  'Dante Valdivia Passano',
]

export const languages = ['Español', 'Inglés']

export const modalities = [
  'Atención en hotel',
  'Atención a domicilio',
  'Atención en clínica',
  'Otro',
]

export const attentionTypes = [
  { value: 'Particular', label: 'Particular' },
  { value: 'EPS', label: 'EPS' },
  { value: 'SCTR', label: 'SCTR' },
  { value: 'Convenio con Inka Rail', label: 'Inka Rail' },
  { value: 'Convenio con colaboradores', label: 'Colaboradores' },
  { value: 'Campaña', label: 'Campaña' },
]

export const countries = [
  'USA',
  'PERU',
  'CANADA',
  'SUIZA',
  'GRAN BRETAÑA',
  'ALEMANIA',
  'ITALIA',
  'JAPON',
  'AUSTRALIA',
  'Otro',
]

export const antecedentOptions = [
  { value: 'Hipertensión arterial', label: 'HTA' },
  { value: 'Diabetes', label: 'Diabetes' },
  { value: 'Asma', label: 'Asma' },
  { value: 'Hiperlipidemia', label: 'Hiperlipidemia' },
  { value: 'Niega', label: 'Niega' },
]

export const habitualMedicationOptions = [
  { value: 'Losartan', label: 'Losartan' },
  { value: 'Enalapril', label: 'Enalapril' },
  { value: 'Salbutamol', label: 'Salbutamol' },
  { value: 'Rosuvastatina', label: 'Rosuvastatina' },
  { value: 'Insulina', label: 'Insulina' },
  { value: 'Metformina', label: 'Metformina' },
  { value: 'Niega', label: 'Niega' },
]

export const allergiesOptions = [
  { value: 'Penicilina', label: 'Penicilina' },
  { value: 'AINES', label: 'AINES' },
  { value: 'Sulfas', label: 'Sulfas' },
  { value: 'Niega', label: 'Niega' },
]

export const vitalFields = [
  { key: 'pressure', label: 'P/A', type: 'text', placeholder: '120/80', unit: 'mmHg' },
  { key: 'heartRate', label: 'FC', type: 'number', placeholder: '72', unit: 'lpm' },
  { key: 'respiratoryRate', label: 'FR', type: 'number', placeholder: '16', unit: 'rpm' },
  { key: 'spo2', label: 'SPO2', type: 'number', placeholder: '98', unit: '%' },
  { key: 'temperature', label: 'T°', type: 'number', step: '0.1', placeholder: '36.5', unit: '°C' },
]

export const physicalExamFields = [
  { key: 'neurologico', label: 'Neurológico' },
  { key: 'pielMucosas', label: 'Piel y Mucosas' },
  { key: 'cabezaCuello', label: 'Cabeza y Cuello' },
  { key: 'ojos', label: 'Ojos' },
  { key: 'oidos', label: 'Oídos' },
  { key: 'nariz', label: 'Nariz' },
  { key: 'orofaringe', label: 'Orofaringe' },
  { key: 'corazon', label: 'Corazón' },
  { key: 'toraxPulmones', label: 'Tórax y Pulmones' },
  { key: 'espalda', label: 'Espalda' },
  { key: 'abdomen', label: 'Abdomen' },
  { key: 'extremidades', label: 'Extremidades' },
  { key: 'genitales', label: 'Genitales' },
  { key: 'recto', label: 'Recto' },
]

export const diagnosisTypeOptions = ['PRESUNTIVO', 'DEFINITIVO', 'REPETITIVO']

export const fallbackCieData = [
  { code: 'A09.0', description: 'Otras gastroenteritis y colitis de origen infeccioso' },
  { code: 'E86.X', description: 'Depleción del volumen' },
  { code: 'J00.X', description: 'Rinofaringitis aguda (resfriado común)' },
  { code: 'J02.0', description: 'Faringitis estreptocócica' },
  { code: 'K30.X', description: 'Dispepsia' },
  { code: 'M54.5', description: 'Lumbago no especificado' },
  { code: 'R10.4', description: 'Otros dolores abdominales' },
  { code: 'R11.X', description: 'Náusea y vómito' },
  { code: 'R50.9', description: 'Fiebre, no especificada' },
  { code: 'R51.X', description: 'Cefalea' },
  { code: 'T70.2', description: 'Efectos de la gran altitud' },
  { code: 'T78.4', description: 'Alergia no especificada' },
]
