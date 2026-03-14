import { useState, useCallback } from 'react'
import { nanoid } from 'nanoid'
import toast from 'react-hot-toast'
import { parseTimeEntries, localParseEntries } from './aiParser'
import type { ManualEntry, ParsedEntry, PersonRole } from './types'

export type EntryStep = 'input' | 'parsing' | 'preview' | 'confirmed'

const PARSING_STEPS = [
  'Extracting dates and durations',
  'Matching PODs and clients from your workspace',
  'Classifying activity types',
  'Building structured rows',
]

export function useManualEntry(
  pods:    string[],
  clients: string[]
) {
  const [step,         setStep]         = useState<EntryStep>('input')
  const [inputText,    setInputText]    = useState('')
  const [parsedRows,   setParsedRows]   = useState<ParsedEntry[]>([])
  const [confirmedRows,setConfirmedRows]= useState<ManualEntry[]>([])
  const [parsingStep,  setParsingStep]  = useState(0)
  const [warnings,     setWarnings]     = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<PersonRole>('Engineering Manager')
  const [personName,   setPersonName]   = useState('Anand Verma')
  const [totalHours,   setTotalHours]   = useState(0)

  /* ── Animate parsing steps ── */
  function animateParsingSteps(onDone: () => void) {
    setParsingStep(0)
    let i = 0
    const iv = setInterval(() => {
      i++
      setParsingStep(i)
      if (i >= PARSING_STEPS.length) {
        clearInterval(iv)
        setTimeout(onDone, 400)
      }
    }, 650)
  }

  /* ── Parse ── */
  const parse = useCallback(async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text first')
      return
    }

    setStep('parsing')
    setParsingStep(0)

    animateParsingSteps(async () => {
      try {
        const useMock = import.meta.env.VITE_USE_MOCK === 'true'
        const result  = useMock
          ? localParseEntries(inputText, pods, clients)
          : await parseTimeEntries(inputText, pods, clients)

        setParsedRows(result.entries)
        setTotalHours(result.totalHours)
        setWarnings(result.warnings)
        setStep('preview')
      } catch (err: any) {
        toast.error(err.message ?? 'Parse failed — falling back to local parser')
        const fallback = localParseEntries(inputText, pods, clients)
        setParsedRows(fallback.entries)
        setTotalHours(fallback.totalHours)
        setWarnings(fallback.warnings)
        setStep('preview')
      }
    })
  }, [inputText, pods, clients])

  /* ── Edit a row ── */
  const updateRow = useCallback((index: number, field: keyof ParsedEntry, value: string | number | null) => {
    setParsedRows(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      const total = next.reduce((s, r) => s + (Number(r.hours) || 0), 0)
      setTotalHours(total)
      return next
    })
  }, [])

  /* ── Delete a row ── */
  const deleteRow = useCallback((index: number) => {
    setParsedRows(prev => {
      const next = prev.filter((_, i) => i !== index)
      setTotalHours(next.reduce((s, r) => s + r.hours, 0))
      return next
    })
  }, [])

  /* ── Add blank row ── */
  const addRow = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    setParsedRows(prev => [
      ...prev,
      { date: today, activity: '', hours: 1, pod: null, client: null, type: 'Meeting', notes: '', confidence: 'medium' },
    ])
  }, [])

  /* ── Confirm ── */
  const confirm = useCallback(() => {
    const entries: ManualEntry[] = parsedRows
      .filter(r => r.activity.trim() && r.hours > 0)
      .map(r => ({
        id:        nanoid(),
        ...r,
        person:    personName,
        role:      selectedRole,
        createdAt: new Date().toISOString(),
      }))

    /* Save to localStorage for now — swap for API call when backend ready */
    const existing = JSON.parse(localStorage.getItem('eap_manual_entries') ?? '[]')
    localStorage.setItem('eap_manual_entries', JSON.stringify([...existing, ...entries]))

    setConfirmedRows(entries)
    setStep('confirmed')
    toast.success(`${entries.length} entries logged successfully`)
  }, [parsedRows, personName, selectedRole])

  /* ── Reset ── */
  const reset = useCallback(() => {
    setStep('input')
    setInputText('')
    setParsedRows([])
    setParsingStep(0)
    setWarnings([])
  }, [])

  return {
    step, setStep,
    inputText, setInputText,
    parsedRows,
    confirmedRows,
    parsingStep,
    parsingSteps: PARSING_STEPS,
    warnings,
    selectedRole, setSelectedRole,
    personName, setPersonName,
    totalHours,
    parse, updateRow, deleteRow, addRow, confirm, reset,
  }
}
