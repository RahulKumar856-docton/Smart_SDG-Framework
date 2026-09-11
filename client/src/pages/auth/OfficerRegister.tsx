import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';

export default function OfficerRegister() {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    department_id: '',
    designation: '',
    password: '',
    confirm_password: ''
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchDepartments = () => {
    setDepartmentsLoading(true);
    setDepartmentsError(false);
    axios.get('/api/departments').then((res) => {
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    }).catch(() => {
      setDepartmentsError(true);
    }).finally(() => {
      setDepartmentsLoading(false);
    });
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', {
        role: 'OFFICER',
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        department_id: formData.department_id,
        employee_id: formData.employee_id,
        designation: formData.designation,
        password: formData.password
      });
      
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Unable to register at this time. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-teal-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
          <p className="text-slate-600 mb-8">
            Your officer account is ready. You can now sign in to the Municipal Officer Portal.
          </p>
          <div className="flex flex-col space-y-3">
            <Link to="/officer/login" className="w-full py-3 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative">
        <Link to="/officer/login" className="absolute -left-16 top-2 text-slate-500 hover:text-slate-900 hidden lg:flex items-center">
          <ChevronLeft className="w-5 h-5" /> Back
        </Link>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">Register as a Municipal Officer</h2>
          <p className="mt-2 text-sm text-slate-600">Create your officer account to access the Municipal Operations Portal.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white py-8 px-4 shadow-sm border border-gray-100 sm:rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 shrink-0" /> {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700">Full Name *</label>
                <div className="mt-1">
                  <input required name="full_name" type="text" value={formData.full_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 outline-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700">Username *</label>
                <div className="mt-1">
                  <input required name="username" type="text" value={formData.username} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700">Official Email *</label>
                <div className="mt-1">
                  <input required name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700">Phone</label>
                <div className="mt-1">
                  <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700">Employee ID *</label>
                <div className="mt-1">
                  <input required name="employee_id" type="text" value={formData.employee_id} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700">Department *</label>
                <div className="mt-1">
                  {departmentsLoading ? (
                    <div className="w-full px-4 py-3 rounded-xl border border-gray-200 text-slate-500 bg-slate-50">Loading departments...</div>
                  ) : departmentsError ? (
                    <div className="w-full px-4 py-3 rounded-xl border border-red-200 text-red-600 bg-red-50 flex justify-between items-center">
                      <span>Unable to load departments.</span>
                      <button type="button" onClick={fetchDepartments} className="text-sm font-bold hover:underline">Retry</button>
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="w-full px-4 py-3 rounded-xl border border-yellow-200 text-yellow-700 bg-yellow-50">No departments are currently available.</div>
                  ) : (
                    <select required name="department_id" value={formData.department_id} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 outline-none bg-white">
                      <option value="" disabled>Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700">Designation *</label>
                <div className="mt-1">
                  <input required name="designation" type="text" value={formData.designation} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 outline-none" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100 my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700">Password *</label>
                <div className="mt-1">
                  <input required name="password" type="password" value={formData.password} onChange={handleChange} minLength={6} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700">Confirm Password *</label>
                <div className="mt-1">
                  <input required name="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange} minLength={6} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-600 outline-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input id="terms" name="terms" type="checkbox" required className="h-4 w-4 text-teal-600 focus:ring-teal-600 border-gray-300 rounded" />
              <label htmlFor="terms" className="ml-2 block text-sm text-slate-700">
                I confirm that the information provided is accurate and official.
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || departments.length === 0}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-teal-700 hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-700 transition-colors disabled:opacity-70"
              >
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registering...</> : 'Submit Registration'}
              </button>
            </div>
            
            <div className="text-center pt-2">
               <Link to="/officer/login" className="text-sm font-semibold text-teal-700 hover:underline">Already have an account? Sign in</Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
