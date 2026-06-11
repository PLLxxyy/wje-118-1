import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EventDetail from './pages/EventDetail';
import Apply from './pages/Apply';
import MyApplications from './pages/MyApplications';
import MySchedule from './pages/MySchedule';
import Checkin from './pages/Checkin';
import Notifications from './pages/Notifications';
import EventList from './pages/organizer/EventList';
import EventForm from './pages/organizer/EventForm';
import PositionList from './pages/organizer/PositionList';
import PositionForm from './pages/organizer/PositionForm';
import Applications from './pages/organizer/Applications';
import ScheduleView from './pages/organizer/ScheduleView';
import VolunteerList from './pages/organizer/VolunteerList';
import Dashboard from './pages/admin/Dashboard';
import Stats from './pages/admin/Stats';

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/events/:id" element={<EventDetail />} />

        {/* Volunteer routes */}
        <Route
          path="/apply/:eventId/:positionId"
          element={
            <ProtectedRoute>
              <Apply />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-schedule"
          element={
            <ProtectedRoute>
              <MySchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute>
              <Checkin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Organizer routes */}
        <Route
          path="/organizer/events"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <EventList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/new"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <EventForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:id/edit"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <EventForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId/positions"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <PositionList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId/positions/new"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <PositionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/positions/:id/edit"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <PositionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId/applications"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId/schedule"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <ScheduleView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId/volunteers"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <VolunteerList />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute roles={['admin']}>
              <Stats />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
