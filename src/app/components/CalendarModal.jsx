import { addHours, differenceInSeconds } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import Modal from 'react-modal'

import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'
import Swal from 'sweetalert2'

import 'react-datepicker/dist/react-datepicker.css'
import 'sweetalert2/dist/sweetalert2.min.css'

import { useCalendarStore, useUiStore } from '../../hooks'

/** Init Data */
const initFormData = {
  title: '',
  notes: '',
  start: new Date(),
  end: addHours(new Date(), 2),
}

/** Modal */
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
}

/** ES DatePicker */
registerLocale('es', es)

Modal.setAppElement('#root')

export const CalendarModal = () => {
  const { isDateModalOpen, closeDateModal } = useUiStore()
  const { activeEvent, startSavingEvent } = useCalendarStore()

  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formValues, setFormValues] = useState(initFormData)

  /** Memoize value when title or formSubmitted value change */
  const titleClass = useMemo(() => {
    if (!formSubmitted) return ''
    return formValues.title.length > 0 ? 'is-valid' : 'is-invalid'
  }, [formValues.title, formSubmitted])

  /** Show current Active Note on Modal */
  useEffect(() => {
    if (activeEvent !== null) {
      setFormValues({
        ...activeEvent,
      })
    }
  }, [activeEvent])

  const onInputChange = ({ target }) => {
    setFormValues({
      ...formValues,
      [target.name]: target.value,
    })
  }

  /** Changing Date, event returns Date selected */
  const onDateChange = (event, changing) => {
    setFormValues({
      ...formValues,
      [changing]: event,
    })
  }

  /** Form Submit */
  const onSubmit = async (event) => {
    event.preventDefault()
    setFormSubmitted(true)

    /** Validate Dates */
    const difference = differenceInSeconds(formValues.end, formValues.start)

    if (isNaN(difference) || difference <= 0) {
      Swal.fire('Fechas Incorrectas', 'Revisar fechas ingresadas', 'error')
      return
    }

    if (formValues.title.length <= 0) return

    /** TODO: Process Data */
    await startSavingEvent(formValues)
    closeDateModal()
    setFormSubmitted(false)
  }

  return (
    <Modal
      className='modal'
      overlayClassName='modal-fondo'
      closeTimeoutMS={200}
      isOpen={isDateModalOpen}
      onRequestClose={closeDateModal}
      style={customStyles}
    >
      <div className='container p-2'>
        <h1> Nuevo evento </h1>
        <hr />
        <form onSubmit={onSubmit} className='container'>
          <div className='row mb-3'>
            <div className='col-md-6 mt-2'>
              <label className='form-label'>Fecha y Hora Inicio</label> <br />
              <DatePicker
                className='form-control'
                locale='es'
                timeCaption='Hora'
                selected={formValues.start}
                onChange={(event) => onDateChange(event, 'start')}
                dateFormat={'Pp'}
                showTimeSelect
              />
            </div>
            <div className='col-md-6 mt-2'>
              <label className='form-label'>Fecha y Hora Fin</label> <br />
              <DatePicker
                className='form-control'
                locale='es'
                timeCaption='Hora'
                minDate={formValues.start}
                selected={formValues.end}
                onChange={(event) => onDateChange(event, 'end')}
                dateFormat={'Pp'}
                showTimeSelect
              />
            </div>
          </div>
          <div className='row mb-3'>
            <div className='col-md-12'>
              <label className='form-label'>Titulo y notas</label>
              <input
                type='text'
                className={`form-control ${titleClass}`}
                placeholder='Título del evento'
                name='title'
                autoComplete='off'
                value={formValues.title}
                onChange={onInputChange}
              />
              <small id='emailHelp' className='form-text text-muted'>
                Una descripción corta
              </small>
            </div>
          </div>

          <div className='row mb-3'>
            <div className='col-md-12'>
              <textarea
                type='text'
                className='form-control'
                placeholder='Notas'
                rows='5'
                name='notes'
                value={formValues.notes}
                onChange={onInputChange}
              ></textarea>
              <small id='emailHelp' className='form-text text-muted'>
                Opcional
              </small>
            </div>
          </div>
          <button type='submit' className='btn btn-outline-primary btn-block'>
            <i className='far fa-save'></i>
            <span> Guardar</span>
          </button>
        </form>
      </div>
    </Modal>
  )
}
