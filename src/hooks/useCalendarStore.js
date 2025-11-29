import { useDispatch, useSelector } from "react-redux";
import {
    onAddNewEvent,
    onDeleteEvent,
    onLoadEvents,
    onSetActiveEvent,
    onUpdateEvent,
} from "../store/calendar/calendarSlice";
import calendarApi from "../api/calendarApi";
import { convertEventsToDate } from "../helpers";
import Swal from "sweetalert2";

export const useCalendarStore = () => {
    const { events, activeEvent } = useSelector((state) => state.calendar);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    /** Start Loading Events */
    const startLoadingEvents = async () => {
        try {
            const { data } = await calendarApi.get("/events");
            const eventsConverted = convertEventsToDate(data.data);
            dispatch(onLoadEvents(eventsConverted));
        } catch (error) {
            console.log(error);
        }
    };

    /** Set Active Event */
    const setActiveEvent = (calendarEvent) => {
        dispatch(onSetActiveEvent(calendarEvent));
    };

    const startSavingEvent = async (calendarEvent) => {
        const { title, notes, start, end } = calendarEvent;

        try {
            // -------- Update Event --------------
            if (calendarEvent.id) {
                await calendarApi.put(`/events/${calendarEvent.id}`, {
                    title,
                    notes,
                    start,
                    end,
                });
                dispatch(onUpdateEvent({ ...calendarEvent, user }));
                return;
            }

            // ---------- Create new Event ---------------
            const { data } = await calendarApi.post("/events", {
                title,
                notes,
                start,
                end,
            });
            const eventData = data.data;
            dispatch(
                onAddNewEvent({ ...calendarEvent, id: eventData.id, user })
            );
        } catch (error) {
            console.log(error);
        }
    };

    /** Delete Event from Active Event */
    const startDeletingEvent = async () => {
        try {
            await calendarApi.delete(`/events/${activeEvent.id}`);
            dispatch(onDeleteEvent());
        } catch (error) {
            /** Errors Backend Response is a String Array */
            const { errors } = error.response.data;
            Swal.fire('Error al eliminar', errors.toString(), 'error');
        }    
    };

    return {
        // Properties
        events,
        activeEvent,
        hasEventSelected: !!activeEvent,
        // Methods
        setActiveEvent,
        startSavingEvent,
        startDeletingEvent,
        startLoadingEvents,
    };
};
