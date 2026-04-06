import { useDeferredValue, useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import './App.css'
import {
  allergiesOptions,
  antecedentOptions,
  attentionTypes,
  countries,
  diagnosisTypeOptions,
  doctors,
  fallbackCieData,
  habitualMedicationOptions,
  languages,
  modalities,
  physicalExamFields,
  vitalFields,
} from './cimaData'
import { buildCognitoLogoutUrl } from './authConfig'

const CIE_URL =
  'https://docs.google.com/spreadsheets/d/1ACNavgucrio_ZgUE_8Xi_2-5Q9KDTU91/export?format=csv&gid=1696766106'

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

function currentClock() {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date())
}

function createDiagnosisRow() {
  return { type: 'PRESUNTIVO', cieCode: '', description: '' }
}

function normalizeCsvText(text) {
  if (!text.includes('Ã')) return text

  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0))
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return text
  }
}

function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).slice(1)

  return lines
    .map((line) => {
      if (!line.trim()) return null

      const columns = []
      let current = ''
      let insideQuotes = false

      for (let index = 0; index < line.length; index += 1) {
        const char = line[index]

        if (char === '"') {
          if (insideQuotes && line[index + 1] === '"') {
            current += '"'
            index += 1
          } else {
            insideQuotes = !insideQuotes
          }
        } else if (char === ',' && !insideQuotes) {
          columns.push(current)
          current = ''
        } else {
          current += char
        }
      }

      columns.push(current)

      const code = (columns[0] || '').trim()
      const description = columns.slice(1).join(',').trim()

      return code && description ? { code, description } : null
    })
    .filter(Boolean)
}

function Section({ icon, title, children }) {
  return (
    <section className="section">
      <div className="section-header">
        <div className="section-icon">{icon}</div>
        <div className="section-title">{title}</div>
      </div>
      <div className="section-body">{children}</div>
    </section>
  )
}

function App() {
  const auth = useAuth()
  const [clock, setClock] = useState(currentClock())
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [cieData, setCieData] = useState(fallbackCieData)
  const [cieError, setCieError] = useState(false)
  const [cieSearch, setCieSearch] = useState('')
  const [activeDiagnosisRow, setActiveDiagnosisRow] = useState(null)
  const [lastSubmission, setLastSubmission] = useState(null)
  const [diagnoses, setDiagnoses] = useState(() =>
    Array.from({ length: 5 }, createDiagnosisRow),
  )
  const [form, setForm] = useState({
    doctor: '',
    reportLanguage: 'Español',
    modality: 'Atención en hotel',
    attentionType: '',
    attentionTypeOther: '',
    patientName: '',
    age: '',
    gender: '',
    country: '',
    documentId: '',
    birthDate: '',
    attentionDate: todayDate(),
    attentionTime: '',
    antecedents: [],
    antecedentsOther: '',
    habitualMedication: [],
    habitualMedicationOther: '',
    allergies: [],
    allergiesOther: '',
    history: '',
    vitals: {
      pressure: '',
      heartRate: '',
      respiratoryRate: '',
      spo2: '',
      temperature: '',
    },
    physicalExam: {
      neurologico: '',
      pielMucosas: '',
      cabezaCuello: '',
      ojos: '',
      oidos: '',
      nariz: '',
      orofaringe: '',
      corazon: '',
      toraxPulmones: '',
      espalda: '',
      abdomen: '',
      extremidades: '',
      genitales: '',
      recto: '',
    },
    auxiliaryExams: '',
    cieAdditional: '',
    treatment: '',
  })
  const deferredCieSearch = useDeferredValue(cieSearch)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClock(currentClock())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadCieData() {
      try {
        const response = await fetch(CIE_URL)
        const csvText = normalizeCsvText(await response.text())
        const parsed = parseCsv(csvText)

        if (isMounted && parsed.length > 0) {
          setCieData(parsed)
          setCieError(false)
        }
      } catch {
        if (isMounted) {
          setCieData(fallbackCieData)
          setCieError(true)
        }
      }
    }

    loadCieData()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const filteredCieData = (() => {
    const query = deferredCieSearch.trim().toLowerCase()
    if (query.length < 2) return cieData.slice(0, 140)
    return cieData
      .filter(
        (item) =>
          item.code.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query),
      )
      .slice(0, 180)
  })()

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateVitals(field, value) {
    setForm((current) => ({
      ...current,
      vitals: { ...current.vitals, [field]: value },
    }))
  }

  function updatePhysicalExam(field, value) {
    setForm((current) => ({
      ...current,
      physicalExam: { ...current.physicalExam, [field]: value },
    }))
  }

  function toggleMultiSelect(field, value) {
    setForm((current) => {
      const selected = current[field]
      return {
        ...current,
        [field]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      }
    })
  }

  function setOtherMultiSelect(field, otherField, checked, value) {
    setForm((current) => {
      const selected = current[field]
      return {
        ...current,
        [field]: checked
          ? selected.includes('__other__')
            ? selected
            : [...selected, '__other__']
          : selected.filter((item) => item !== '__other__'),
        [otherField]: checked ? value : '',
      }
    })
  }

  function updateOtherText(field, otherField, value) {
    setForm((current) => {
      const selected = current[field]
      const hasOther = selected.includes('__other__')
      return {
        ...current,
        [field]:
          value && !hasOther
            ? [...selected, '__other__']
            : value
              ? selected
              : selected.filter((item) => item !== '__other__'),
        [otherField]: value,
      }
    })
  }

  function updateDiagnosis(index, field, value) {
    setDiagnoses((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    )
  }

  function clearDiagnosis(index) {
    setDiagnoses((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? createDiagnosisRow() : row,
      ),
    )

    if (activeDiagnosisRow === index) setActiveDiagnosisRow(null)
  }

  function insertCieInActiveRow(code, description) {
    if (activeDiagnosisRow === null) {
      showToast('Selecciona una fila primero con ▶ CIE', 'error')
      return
    }

    setDiagnoses((current) =>
      current.map((row, rowIndex) =>
        rowIndex === activeDiagnosisRow
          ? { ...row, cieCode: code, description }
          : row,
      ),
    )

    showToast(`Se insertó ${code} en Diagnóstico ${activeDiagnosisRow + 1}`)
    setActiveDiagnosisRow(null)
  }

  function joinedValues(list, otherValue) {
    return [...list.filter((item) => item !== '__other__'), otherValue.trim()]
      .filter(Boolean)
      .join(', ')
  }

  function buildPayload() {
    const payload = {
      MEDICO: form.doctor,
      'Idioma del informe': form.reportLanguage,
      'Modalidad de atención': form.modality,
      'Tipo de atención':
        form.attentionType === 'otro_tipo'
          ? form.attentionTypeOther
          : form.attentionType,
      Nombre: form.patientName,
      Edad: form.age,
      Género: form.gender,
      País: form.country,
      'DNI/PASAPORTE': form.documentId,
      'Fecha de Nacimiento': form.birthDate,
      'Fecha de atención': form.attentionDate,
      'Hora de atención': form.attentionTime,
      'Antecedentes Patológicos': joinedValues(
        form.antecedents,
        form.antecedentsOther,
      ),
      'Medicación Habitual': joinedValues(
        form.habitualMedication,
        form.habitualMedicationOther,
      ),
      Alergias: joinedValues(form.allergies, form.allergiesOther),
      'Historial de la enfermedad': form.history,
      'P/A': form.vitals.pressure,
      FC: form.vitals.heartRate,
      FR: form.vitals.respiratoryRate,
      SPO2: form.vitals.spo2,
      'T°': form.vitals.temperature,
      'Exámenes': form.auxiliaryExams,
      Tratamiento: form.treatment,
    }

    diagnoses.forEach((diagnosis, index) => {
      payload[`Diagnóstico ${index + 1} — Tipo`] = diagnosis.type
      payload[`Diagnóstico ${index + 1} — CIE-10`] = diagnosis.cieCode
      payload[`Diagnóstico ${index + 1} — Descripción`] = diagnosis.description
    })

    return payload
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.doctor || !form.patientName || !form.attentionDate) {
      showToast('Completa: Médico, Nombre y Fecha de atención', 'error')
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => window.setTimeout(resolve, 1200))
    setIsLoading(false)
    setLastSubmission(buildPayload())
    showToast('Formulario listo para integrarse con tu backend AWS')
  }

  function handleSignOut() {
    auth.removeUser()

    const logoutUrl = buildCognitoLogoutUrl()
    if (logoutUrl) {
      window.location.href = logoutUrl
    }
  }

  if (auth.isLoading) {
    return <div className="auth-screen">Cargando autenticacion...</div>
  }

  if (auth.error) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Error de autenticacion</h1>
          <p>{auth.error.message}</p>
          <button className="auth-button" onClick={() => auth.signinRedirect()}>
            Reintentar inicio de sesion
          </button>
        </div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-kicker">CIMA</div>
          <h1>Acceso para personal medico</h1>
          <p>
            Inicia sesion con Cognito para continuar al formulario clinico y
            trabajar con tus permisos del sistema.
          </p>
          <button className="auth-button" onClick={() => auth.signinRedirect()}>
            Iniciar sesion
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="header">
        <div className="logo">
          <div className="logo-mark">C</div>
          <div>
            <div className="logo-name">CIMA</div>
            <div className="logo-sub">Informes Medicos</div>
          </div>
        </div>
        <div className="header-right">
          <div>{clock}</div>
          <div className="header-status">
            {auth.user?.profile.email || auth.user?.profile.preferred_username}
          </div>
          <button className="header-signout" onClick={handleSignOut}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="cie-panel">
          <div className="cie-header">
            <div className="cie-title">Buscador CIE-10</div>
            <div className="cie-search-wrap">
              <span className="cie-search-icon">⌕</span>
              <input
                className="cie-search"
                type="text"
                value={cieSearch}
                onChange={(event) => setCieSearch(event.target.value)}
                placeholder="Codigo o termino..."
              />
            </div>
            <div className="cie-count">
              {cieData.length.toLocaleString()} codigos disponibles
            </div>
            <div className="cie-hint">
              {activeDiagnosisRow === null
                ? 'Selecciona una fila y luego elige el código en esta lista'
                : `Insertando en Diagnostico ${activeDiagnosisRow + 1}`}
            </div>
            {cieError ? (
              <div className="cie-offline-note">
                Usando una lista local de respaldo.
              </div>
            ) : null}
          </div>

          <div
            className={`active-row-indicator ${
              activeDiagnosisRow !== null ? 'show' : ''
            }`}
          >
            ▶ Insertar en Diagnostico{' '}
            <span>{activeDiagnosisRow !== null ? activeDiagnosisRow + 1 : '—'}</span>
          </div>

          <div className="cie-list">
            {filteredCieData.length === 0 ? (
              <div className="cie-empty">Sin resultados</div>
            ) : (
              filteredCieData.map((item) => (
                <button
                  key={`${item.code}-${item.description}`}
                  className="cie-item"
                  type="button"
                  onClick={() => insertCieInActiveRow(item.code, item.description)}
                >
                  <div className="cie-item-code">{item.code}</div>
                  <div className="cie-item-desc">{item.description}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <form className="form-area" onSubmit={handleSubmit}>
          <Section icon="👨‍⚕️" title="Configuración del Informe">
            <div className="grid-3">
              <div className="field">
                <label>Médico *</label>
                <select
                  value={form.doctor}
                  onChange={(event) => updateField('doctor', event.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor} value={doctor}>
                      {doctor}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Idioma del Informe *</label>
                <select
                  value={form.reportLanguage}
                  onChange={(event) =>
                    updateField('reportLanguage', event.target.value)
                  }
                >
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Modalidad de Atención</label>
                <select
                  value={form.modality}
                  onChange={(event) => updateField('modality', event.target.value)}
                >
                  {modalities.map((modality) => (
                    <option key={modality} value={modality}>
                      {modality}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="divider" />

            <div className="field">
              <label>Tipo de Atención</label>
              <div className="check-group">
                {attentionTypes.map((type) => (
                  <label key={type.value} className="check-item">
                    <input
                      type="radio"
                      name="attentionType"
                      checked={form.attentionType === type.value}
                      onChange={() => updateField('attentionType', type.value)}
                    />
                    {type.label}
                  </label>
                ))}
                <label className="check-item otro-item">
                  <input
                    type="radio"
                    name="attentionType"
                    checked={form.attentionType === 'otro_tipo'}
                    onChange={() => updateField('attentionType', 'otro_tipo')}
                  />
                  <input
                    className="otro-input"
                    type="text"
                    value={form.attentionTypeOther}
                    onChange={(event) => {
                      updateField('attentionType', 'otro_tipo')
                      updateField('attentionTypeOther', event.target.value)
                    }}
                    placeholder="Otro..."
                  />
                </label>
              </div>
            </div>
          </Section>

          <Section icon="🧑" title="Datos del Paciente">
            <div className="grid-3 soft-gap">
              <div className="field">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={(event) =>
                    updateField('patientName', event.target.value)
                  }
                  placeholder="Apellidos y nombres"
                  required
                />
              </div>
              <div className="field">
                <label>Edad *</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={form.age}
                  onChange={(event) => updateField('age', event.target.value)}
                  placeholder="Años"
                  required
                />
              </div>
              <div className="field">
                <label>Género</label>
                <select
                  value={form.gender}
                  onChange={(event) => updateField('gender', event.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                </select>
              </div>
            </div>

            <div className="grid-3 soft-gap">
              <div className="field">
                <label>País</label>
                <select
                  value={form.country}
                  onChange={(event) => updateField('country', event.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>DNI / Pasaporte</label>
                <input
                  type="text"
                  value={form.documentId}
                  onChange={(event) =>
                    updateField('documentId', event.target.value)
                  }
                  placeholder="Numero de documento"
                />
              </div>
              <div className="field">
                <label>Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    updateField('birthDate', event.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Fecha de Atención *</label>
                <input
                  type="date"
                  value={form.attentionDate}
                  onChange={(event) =>
                    updateField('attentionDate', event.target.value)
                  }
                  required
                />
              </div>
              <div className="field">
                <label>Hora de Atención</label>
                <input
                  type="time"
                  value={form.attentionTime}
                  onChange={(event) =>
                    updateField('attentionTime', event.target.value)
                  }
                />
              </div>
            </div>
          </Section>

          <Section icon="📋" title="Antecedentes">
            <div className="field with-margin">
              <label>Antecedentes Patológicos</label>
              <div className="check-group">
                {antecedentOptions.map((item) => (
                  <label key={item.value} className="check-item">
                    <input
                      type="checkbox"
                      checked={form.antecedents.includes(item.value)}
                      onChange={() => toggleMultiSelect('antecedents', item.value)}
                    />
                    {item.label}
                  </label>
                ))}
                <label className="check-item otro-item">
                  <input
                    type="checkbox"
                    checked={form.antecedents.includes('__other__')}
                    onChange={(event) =>
                      setOtherMultiSelect(
                        'antecedents',
                        'antecedentsOther',
                        event.target.checked,
                        form.antecedentsOther,
                      )
                    }
                  />
                  <input
                    className="otro-input"
                    type="text"
                    value={form.antecedentsOther}
                    onChange={(event) =>
                      updateOtherText(
                        'antecedents',
                        'antecedentsOther',
                        event.target.value,
                      )
                    }
                    placeholder="Otro..."
                  />
                </label>
              </div>
            </div>

            <div className="field with-margin">
              <label>Medicación Habitual</label>
              <div className="check-group">
                {habitualMedicationOptions.map((item) => (
                  <label key={item.value} className="check-item">
                    <input
                      type="checkbox"
                      checked={form.habitualMedication.includes(item.value)}
                      onChange={() =>
                        toggleMultiSelect('habitualMedication', item.value)
                      }
                    />
                    {item.label}
                  </label>
                ))}
                <label className="check-item otro-item">
                  <input
                    type="checkbox"
                    checked={form.habitualMedication.includes('__other__')}
                    onChange={(event) =>
                      setOtherMultiSelect(
                        'habitualMedication',
                        'habitualMedicationOther',
                        event.target.checked,
                        form.habitualMedicationOther,
                      )
                    }
                  />
                  <input
                    className="otro-input"
                    type="text"
                    value={form.habitualMedicationOther}
                    onChange={(event) =>
                      updateOtherText(
                        'habitualMedication',
                        'habitualMedicationOther',
                        event.target.value,
                      )
                    }
                    placeholder="Otro..."
                  />
                </label>
              </div>
            </div>

            <div className="field">
              <label>Alergias</label>
              <div className="check-group">
                {allergiesOptions.map((item) => (
                  <label key={item.value} className="check-item">
                    <input
                      type="checkbox"
                      checked={form.allergies.includes(item.value)}
                      onChange={() => toggleMultiSelect('allergies', item.value)}
                    />
                    {item.label}
                  </label>
                ))}
                <label className="check-item otro-item">
                  <input
                    type="checkbox"
                    checked={form.allergies.includes('__other__')}
                    onChange={(event) =>
                      setOtherMultiSelect(
                        'allergies',
                        'allergiesOther',
                        event.target.checked,
                        form.allergiesOther,
                      )
                    }
                  />
                  <input
                    className="otro-input"
                    type="text"
                    value={form.allergiesOther}
                    onChange={(event) =>
                      updateOtherText(
                        'allergies',
                        'allergiesOther',
                        event.target.value,
                      )
                    }
                    placeholder="Otro..."
                  />
                </label>
              </div>
            </div>
          </Section>

          <Section icon="❤️" title="Historia Clínica y Signos Vitales">
            <div className="field with-margin">
              <label>Historial de la Enfermedad</label>
              <textarea
                rows="4"
                value={form.history}
                onChange={(event) => updateField('history', event.target.value)}
                placeholder="Descripcion detallada de la enfermedad actual..."
              />
            </div>

            <div className="field">
              <label>Signos Vitales</label>
              <div className="vitals-grid">
                {vitalFields.map((vital) => (
                  <div key={vital.key} className="vital-box">
                    <div className="vital-label">{vital.label}</div>
                    <input
                      className="vital-input"
                      type={vital.type}
                      step={vital.step}
                      value={form.vitals[vital.key]}
                      onChange={(event) =>
                        updateVitals(vital.key, event.target.value)
                      }
                      placeholder={vital.placeholder}
                    />
                    <div className="vital-unit">{vital.unit}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section icon="🩺" title="Examen Físico por Sistemas">
            <div className="grid-2">
              {physicalExamFields.map((item) => (
                <div key={item.key} className="field">
                  <label>{item.label}</label>
                  <textarea
                    rows="2"
                    value={form.physicalExam[item.key]}
                    onChange={(event) =>
                      updatePhysicalExam(item.key, event.target.value)
                    }
                    placeholder="Hallazgos..."
                  />
                </div>
              ))}
            </div>

            <div className="field top-gap">
              <label>Exámenes Auxiliares</label>
              <textarea
                rows="3"
                value={form.auxiliaryExams}
                onChange={(event) =>
                  updateField('auxiliaryExams', event.target.value)
                }
                placeholder="Resultados de laboratorio, imagenes, etc..."
              />
            </div>
          </Section>

          <Section icon="🔬" title="Diagnósticos CIE-10">
            <p className="helper-copy">
              Haz clic en <strong>▶ CIE</strong> para activar la fila y luego
              elige el código desde el panel izquierdo.
            </p>

            <div className="table-wrap">
              <table className="diag-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tipo</th>
                    <th>Código CIE-10</th>
                    <th>Descripción</th>
                    <th>▶ CIE</th>
                    <th>✕</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnoses.map((diagnosis, index) => (
                    <tr
                      key={`diagnosis-row-${index + 1}`}
                      className={activeDiagnosisRow === index ? 'active-row' : ''}
                    >
                      <td className="row-num" data-label="#">
                        {index + 1}
                      </td>
                      <td data-label="Tipo">
                        <select
                          className={`tipo-select ${diagnosis.type.toLowerCase()}`}
                          value={diagnosis.type}
                          onChange={(event) =>
                            updateDiagnosis(index, 'type', event.target.value)
                          }
                        >
                          {diagnosisTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Código CIE-10">
                        <input
                          className="cie-cell-input"
                          type="text"
                          value={diagnosis.cieCode}
                          onChange={(event) =>
                            updateDiagnosis(index, 'cieCode', event.target.value)
                          }
                          placeholder="A00.0"
                          maxLength={10}
                        />
                      </td>
                      <td className="description-cell" data-label="Descripción">
                        <input
                          className="desc-cell-input"
                          type="text"
                          value={diagnosis.description}
                          onChange={(event) =>
                            updateDiagnosis(index, 'description', event.target.value)
                          }
                          placeholder="Descripcion..."
                        />
                      </td>
                      <td data-label="Seleccionar CIE">
                        <button
                          className={`btn-select-cie ${
                            activeDiagnosisRow === index ? 'active' : ''
                          }`}
                          type="button"
                          onClick={() =>
                            setActiveDiagnosisRow((current) =>
                              current === index ? null : index,
                            )
                          }
                        >
                          ▶ CIE
                        </button>
                      </td>
                      <td data-label="Limpiar">
                        <button
                          className="btn-clear-row"
                          type="button"
                          onClick={() => clearDiagnosis(index)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="field top-gap">
              <label>CIE-10 adicionales o no encontrados</label>
              <textarea
                rows="2"
                value={form.cieAdditional}
                onChange={(event) =>
                  updateField('cieAdditional', event.target.value)
                }
                placeholder="Ej: M89.2 - Trastorno óseo, otro diagnóstico no listado..."
              />
            </div>
          </Section>

          <Section icon="💊" title="Tratamiento">
            <div className="field">
              <label>Plan de Tratamiento</label>
              <textarea
                rows="5"
                value={form.treatment}
                onChange={(event) =>
                  updateField('treatment', event.target.value)
                }
                placeholder="Medicamentos, dosis, indicaciones, reposo, seguimiento..."
              />
            </div>
          </Section>

          <section className="submit-section">
            <button className="btn-submit" type="submit" disabled={isLoading}>
              <span>Generar Informe CIMA</span>
              <span>→</span>
            </button>
            <div className="submit-note">
              Esta versión React simula el envío local y deja el payload listo
              para integrar con tu backend.
            </div>
            {lastSubmission ? (
              <details className="payload-preview">
                <summary>Ver payload de ejemplo</summary>
                <pre>{JSON.stringify(lastSubmission, null, 2)}</pre>
              </details>
            ) : null}
          </section>
        </form>
      </main>

      <div className={`loading-overlay ${isLoading ? 'show' : ''}`}>
        <div className="loading-spinner" />
        <div className="loading-text">Generando informe...</div>
        <div className="loading-sub">La maqueta React está preparando los datos</div>
      </div>

      <div className={`toast ${toast ? `show ${toast.type}` : ''}`}>
        {toast?.message}
      </div>
    </>
  )
}

export default App
