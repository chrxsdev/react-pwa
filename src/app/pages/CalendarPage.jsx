import { useEffect, useState } from "react";
import { Calendar } from 'react-big-calendar';

import { NavBar, CalendarBox, CalendarModal, FabAddNew, FabDelete } from "../";
import { getMessagesEs, localizer } from "../../helpers";
import { useAuthStore, useCalendarStore, useUiStore } from "../../hooks";

import 'react-big-calendar/lib/css/react-big-calendar.css';

export const CalendarPage = () => {
	const { user } = useAuthStore();
	const { events, setActiveEvent, startLoadingEvents } = useCalendarStore();
	const { openDateModal } = useUiStore();
	const [lastView, setLastView] = useState(localStorage.getItem('lastView') || 'week');

	/** Load Events when CalendarPage Loaded */
	useEffect(() => {
		startLoadingEvents();
	}, []);


	const eventStyleGetter = (event, start, end, isSelected) => {
		const isMyEvent = (user.uid === event.user.id);
		const style = {
			backgroundColor: (isMyEvent ? '#347cf7' : '#465660'),
			borderRadius: '4px',
			opacity: 0.8
		}
		return {
			style
		}
	}

	/** OnDouble Click Event */
	const onDoubleClick = (event) => {
		openDateModal();
	}

	/** On Select Event */
	const onSelect = (event) => {
		const { sourceResource, ...rest } = event;
		setActiveEvent(rest);
	}

	/** On View Change and Keep last View when refresh page */
	const onViewChanged = (event) => {
		setLastView(() => localStorage.setItem('lastView', event));
	}

	return (
		<>
			<NavBar />
			<Calendar
				culture='es'
				localizer={localizer}
				defaultView={lastView}
				events={events}
				startAccessor="start"
				endAccessor="end"
				messages={getMessagesEs()}
				style={{ height: 'calc(100vh - 80px)' }}
				eventPropGetter={eventStyleGetter}
				components={{
					event: CalendarBox
				}}
				onSelectEvent={onSelect}
				onDoubleClickEvent={onDoubleClick}
				onView={onViewChanged}
			/>
			<CalendarModal />
			<FabAddNew />
			<FabDelete />
		</>
	)
}
