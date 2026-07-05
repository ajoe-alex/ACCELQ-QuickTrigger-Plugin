import { useState } from 'react'
import { DEFAULT_TILE_VALUES } from '../hooks/useTiles'
import { CloseIcon, EyeIcon, EyeOffIcon } from './Icons'
import { extractTileFieldsFromCurl } from '../utils/curl'

const FIELD_LABELS = {
  label: 'Tile Name (optional)',
  baseUrl: 'Base URL',
  tenantCode: 'Tenant Code',
  projectName: 'Project Name',
  templateJobId: 'Template Job ID',
  userId: 'User ID',
  apiKey: 'API Key',
  pollFrequency: 'Poll Frequency (seconds)',
}

const REQUIRED_FIELDS = ['baseUrl', 'tenantCode', 'projectName', 'templateJobId', 'userId', 'apiKey']

export default function TileForm({ initialData, onSubmit, onClose }) {
  const isEdit = !!initialData
  const [values, setValues] = useState(() => ({
    label: '',
    ...DEFAULT_TILE_VALUES,
    ...(initialData || {}),
  }))
  const [showApiKey, setShowApiKey] = useState(false)
  const [errors, setErrors] = useState({})
  const [curlInput, setCurlInput] = useState('')
  const [curlError, setCurlError] = useState('')
  const [curlNote, setCurlNote] = useState(null)
  const [curlSuccess, setCurlSuccess] = useState(false)

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
  }

  const handleParseCurl = () => {
    try {
      const { fields, note } = extractTileFieldsFromCurl(curlInput)
      setValues((v) => ({ ...v, ...fields }))
      setCurlError('')
      setCurlNote(note)
      setCurlSuccess(true)
      setTimeout(() => setCurlSuccess(false), 2500)
    } catch (err) {
      setCurlSuccess(false)
      setCurlNote(null)
      setCurlError(err.message)
    }
  }

  const validate = () => {
    const nextErrors = {}
    REQUIRED_FIELDS.forEach((field) => {
      if (!String(values[field] ?? '').trim()) {
        nextErrors[field] = 'Required'
      }
    })
    if (values.baseUrl && !/^https?:\/\//i.test(values.baseUrl.trim())) {
      nextErrors.baseUrl = 'Must start with http:// or https://'
    }
    if (values.pollFrequency && Number(values.pollFrequency) < 3) {
      nextErrors.pollFrequency = 'Minimum 3 seconds'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...values,
      baseUrl: values.baseUrl.trim(),
      tenantCode: values.tenantCode.trim(),
      projectName: values.projectName.trim(),
      templateJobId: String(values.templateJobId).trim(),
      userId: values.userId.trim(),
      apiKey: values.apiKey.trim(),
      pollFrequency: Math.max(3, Number(values.pollFrequency) || 10),
      label: values.label.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {isEdit ? 'Edit Tile' : 'Add New Tile'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 p-3 space-y-2">
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Paste a curl command to auto-fill (optional)
            </span>
            <textarea
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              rows={3}
              placeholder='curl --location --request POST "https://app.accelq.io/awb/api/2.0/aqsupport/AjoeAlexProject/test-exec/jobs/templates/9782/run" --header "user_id: ..." --header "api_key: ..."'
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleParseCurl}
                disabled={!curlInput.trim()}
                className="text-xs font-medium rounded-lg bg-slate-700 text-white px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Fill fields from curl
              </button>
              {curlSuccess && <span className="text-xs text-emerald-600 dark:text-emerald-400">Fields populated ✓</span>}
            </div>
            {curlError && <p className="text-xs text-red-500">{curlError}</p>}
            {curlNote && <p className="text-xs text-amber-600 dark:text-amber-400">{curlNote}</p>}
          </div>

          <Field label={FIELD_LABELS.label} error={errors.label}>
            <input
              type="text"
              value={values.label}
              onChange={handleChange('label')}
              placeholder="e.g. Google Test Suite"
              className={inputClass()}
            />
          </Field>

          <Field label={FIELD_LABELS.baseUrl} error={errors.baseUrl} required>
            <input
              type="text"
              value={values.baseUrl}
              onChange={handleChange('baseUrl')}
              placeholder="https://app.accelq.io/"
              className={inputClass(errors.baseUrl)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={FIELD_LABELS.tenantCode} error={errors.tenantCode} required>
              <input
                type="text"
                value={values.tenantCode}
                onChange={handleChange('tenantCode')}
                placeholder="aqsupport"
                className={inputClass(errors.tenantCode)}
              />
            </Field>
            <Field label={FIELD_LABELS.projectName} error={errors.projectName} required>
              <input
                type="text"
                value={values.projectName}
                onChange={handleChange('projectName')}
                placeholder="AjoeAlexProject"
                className={inputClass(errors.projectName)}
              />
            </Field>
          </div>

          <Field label={FIELD_LABELS.templateJobId} error={errors.templateJobId} required>
            <input
              type="text"
              value={values.templateJobId}
              onChange={handleChange('templateJobId')}
              placeholder="9782"
              className={inputClass(errors.templateJobId)}
            />
          </Field>

          <Field label={FIELD_LABELS.userId} error={errors.userId} required>
            <input
              type="text"
              value={values.userId}
              onChange={handleChange('userId')}
              placeholder="aq_support@aqsupport.com"
              className={inputClass(errors.userId)}
            />
          </Field>

          <Field label={FIELD_LABELS.apiKey} error={errors.apiKey} required>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={values.apiKey}
                onChange={handleChange('apiKey')}
                placeholder="API key"
                autoComplete="off"
                className={inputClass(errors.apiKey) + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowApiKey((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                tabIndex={-1}
              >
                {showApiKey ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </Field>

          <Field label={FIELD_LABELS.pollFrequency} error={errors.pollFrequency}>
            <input
              type="number"
              min={3}
              value={values.pollFrequency}
              onChange={handleChange('pollFrequency')}
              className={inputClass(errors.pollFrequency)}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition-colors"
            >
              {isEdit ? 'Save Changes' : 'Create Tile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, required, children }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  )
}

function inputClass(hasError) {
  return [
    'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-100',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
    hasError ? 'border-red-400' : 'border-slate-300 dark:border-slate-700',
  ].join(' ')
}
