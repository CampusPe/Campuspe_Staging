import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5001';

function normalizeInvitation(raw) {
  if (!raw) return null;

  console.log('Normalizing invitation data:', raw); // Debug log

  // The invitation data structure from API
  const inv = raw;

  // Job info from populated jobId field
  const job = inv?.jobId || inv?.job || {};
  
  // Company info from populated recruiterId field  
  const recruiter = inv?.recruiterId || inv?.recruiter || {};
  const companyInfo = recruiter?.companyInfo || {};
  
  // College info from populated collegeId field
  const college = inv?.collegeId || inv?.college || {};

  // Profile info for contact person
  const profile = recruiter?.profile || recruiter?.user || {};

  // Job details
  const jobTitle = job?.title || 'Not specified';
  const jobDescription = job?.description || 'No description provided';
  const jobRequirements = job?.requirements || [];
  const companyName = job?.companyName || companyInfo?.companyName || companyInfo?.name || 'Not specified';

  // Salary information (might not be in the job object)
  const salary = job?.salary || job?.compensation || null;

  // Dates
  const sentAt = inv?.sentAt || inv?.createdAt || null;
  const expiresAt = inv?.expiresAt || inv?.validTill || null;
  const respondedAt = inv?.respondedAt || inv?.updatedAt || null;

  // Proposed campus visit dates
  const proposedDates = inv?.proposedDates || inv?.campusVisitDates || [];

  // Application deadline
  const applicationDeadline = job?.applicationDeadline || inv?.applicationDeadline || null;

  // Status
  const status = inv?.status || 'pending';

  return {
    id: inv?._id || inv?.id,
    status,
    job: {
      id: job?._id || job?.id,
      title: jobTitle,
      companyName,
      description: jobDescription,
      requirements: Array.isArray(jobRequirements) ? jobRequirements : [],
      type: job?.type || job?.jobType || 'Not specified',
      location: job?.location || 'Not specified',
      experience: job?.experience || job?.experienceRequired || 'Not specified',
      salary: salary ? {
        currency: salary.currency || '₹',
        min: salary.min || salary.minimum || null,
        max: salary.max || salary.maximum || null,
        negotiable: salary.negotiable || false
      } : null,
      applicationDeadline,
    },
    company: {
      name: companyName,
      industry: companyInfo?.industry || 'Not specified',
      size: companyInfo?.size || companyInfo?.companySize || 'Not specified',
      location: companyInfo?.location || companyInfo?.headquarters || 'Not specified',
      website: companyInfo?.website || '',
      description: companyInfo?.description || '',
    },
    recruiter: {
      id: recruiter?._id || recruiter?.id,
      name: profile?.firstName && profile?.lastName 
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : profile?.name || 'Not specified',
      designation: profile?.designation || profile?.title || 'Not specified',
      department: profile?.department || '',
      email: recruiter?.email || profile?.email || '',
      linkedinUrl: profile?.linkedinUrl || profile?.linkedin || '',
    },
    college: {
      id: college?._id || college?.id,
      name: college?.name || 'Not specified',
      location: college?.location || 'Not specified',
    },
    student: {
      id: null, // This might not be relevant for this invitation type
      name: 'Not specified',
      email: '',
      course: 'Not specified',
      year: 'Not specified',
    },
    sentAt,
    expiresAt,
    respondedAt,
    invitationMessage: inv?.message || inv?.invitationMessage || inv?.note || '',
    proposedDates: Array.isArray(proposedDates)
      ? proposedDates.map(d => ({
          startDate: d?.startDate || d?.start || d?.from || d?.date || null,
          endDate: d?.endDate || d?.end || d?.to || d?.date || null,
          isFlexible: !!(d?.isFlexible || d?.flexible),
        }))
      : [],
    negotiationHistory: Array.isArray(inv?.negotiationHistory || inv?.timeline || inv?.history)
      ? (inv?.negotiationHistory || inv?.timeline || inv?.history).map(item => ({
          actor: item?.actor || item?.by || item?.user || 'system',
          action: item?.action || item?.type || 'updated',
          timestamp: item?.timestamp || item?.at || item?.time || null,
          details: item?.details || item?.message || item?.note || '',
        }))
      : [],
  };
}

const InvitationDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchInvitation = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await axios.get(`${API_BASE}/api/invitations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Raw API response:', res.data); // Debug log
        
        // Extract invitation data from API response structure
        const invitationData = res.data?.data?.invitation || res.data?.invitation || res.data;
        const normalized = normalizeInvitation(invitationData);
        if (normalized) {
          setInvitation(normalized);
        } else {
          setError('Invitation not found');
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [id, router]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Not provided';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading invitation details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Invitation not found</div>
      </div>
    );
  }

  const statusBadge =
    invitation.status === 'pending'
      ? 'bg-yellow-100 text-yellow-800'
      : invitation.status === 'accepted'
      ? 'bg-green-100 text-green-800'
      : invitation.status === 'declined'
      ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-800';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="border-b pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Invitation Details</h1>
            <div className="flex items-center flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge}`}>
                {String(invitation.status || '').toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">ID: {invitation.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Job Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg text-gray-900">
                  {invitation.job?.title || 'Not specified'}
                </h3>
                <p className="text-gray-600 mt-1">
                  {invitation.job?.companyName || 'Not specified'}
                </p>
                <p className="text-gray-600 mt-2">
                  {invitation.job?.description || 'No description provided'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Location: </span>
                    <span className="text-gray-600">{invitation.job?.location || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Job Type: </span>
                    <span className="text-gray-600">{invitation.job?.type || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Experience: </span>
                    <span className="text-gray-600">{invitation.job?.experience || 'Not specified'}</span>
                  </div>
                </div>

                {invitation.job?.skills && invitation.job.skills.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700">Required Skills: </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {invitation.job.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {invitation.job?.salary ? (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700">Salary: </span>
                    <span className="text-green-600">
                      {invitation.job.salary.currency}{' '}
                      {invitation.job.salary.min != null
                        ? Number(invitation.job.salary.min).toLocaleString()
                        : '—'}
                      {' '}–{' '}
                      {invitation.job.salary.max != null
                        ? Number(invitation.job.salary.max).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700">Salary: </span>
                    <span className="text-gray-600">Not provided</span>
                  </div>
                )}

                <div className="mt-2">
                  <span className="text-sm font-medium text-gray-700">Application Deadline: </span>
                  <span className="text-gray-600">
                    {formatDate(invitation.job?.applicationDeadline)}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  {invitation.recruiter?.companyInfo?.logo ? (
                    <img 
                      src={invitation.recruiter.companyInfo.logo} 
                      alt={invitation.recruiter.companyInfo.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {invitation.recruiter?.companyInfo?.name?.charAt(0) || '🏢'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-lg text-gray-900">
                      {invitation.recruiter?.companyInfo?.name || 'Not specified'}
                    </h3>
                    <p className="text-gray-600">
                      {invitation.recruiter?.companyInfo?.industry || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Location: </span>
                    <span className="text-gray-600">{invitation.recruiter?.companyInfo?.location || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Company Size: </span>
                    <span className="text-gray-600">{invitation.recruiter?.companyInfo?.size || 'Not specified'}</span>
                  </div>
                  {invitation.recruiter?.companyInfo?.website && (
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-gray-700">Website: </span>
                      <a 
                        href={invitation.recruiter.companyInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {invitation.recruiter.companyInfo.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Contact Person</h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Name: </span>
                      <span className="text-gray-600">
                        {(invitation.recruiter?.profile?.firstName || '—')}{' '}
                        {(invitation.recruiter?.profile?.lastName || '')}
                      </span>
                    </div>
                    {invitation.recruiter?.profile?.designation && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Designation: </span>
                        <span className="text-gray-600">{invitation.recruiter.profile.designation}</span>
                      </div>
                    )}
                    {invitation.recruiter?.profile?.email && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Email: </span>
                        <a href={`mailto:${invitation.recruiter.profile.email}`} className="text-blue-600 hover:text-blue-800">
                          {invitation.recruiter.profile.email}
                        </a>
                      </div>
                    )}
                    {invitation.recruiter?.profile?.phone && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Phone: </span>
                        <a href={`tel:${invitation.recruiter.profile.phone}`} className="text-blue-600 hover:text-blue-800">
                          {invitation.recruiter.profile.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Student & College Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Student Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg text-gray-900">
                  {invitation.student?.name || 'Not specified'}
                </h3>
                <div className="space-y-2 mt-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Course: </span>
                    <span className="text-gray-600">{invitation.student?.course || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Year: </span>
                    <span className="text-gray-600">{invitation.student?.year || 'Not specified'}</span>
                  </div>
                  {invitation.student?.email && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Email: </span>
                      <a href={`mailto:${invitation.student.email}`} className="text-blue-600 hover:text-blue-800">
                        {invitation.student.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* College Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">College Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg text-gray-900">
                  {invitation.college?.name || 'Not specified'}
                </h3>
                <div className="space-y-2 mt-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Location: </span>
                    <span className="text-gray-600">{invitation.college?.location || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Invitation Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Sent: </span>
                  <span className="text-gray-600">{formatDate(invitation.sentAt)}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Expires: </span>
                  <span className="text-gray-600">{formatDate(invitation.expiresAt)}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Responded: </span>
                  <span className="text-gray-600">{formatDate(invitation.respondedAt)}</span>
                </div>
              </div>

              {invitation.invitationMessage ? (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-700">Message: </span>
                  <p className="text-gray-600 mt-1">{invitation.invitationMessage}</p>
                </div>
              ) : null}
            </div>

            {/* Proposed Dates */}
            {invitation.proposedDates?.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Proposed Campus Visit Dates</h3>
                <div className="space-y-2">
                  {invitation.proposedDates.map((dateObj, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-gray-600">
                        {formatDate(dateObj.startDate)} - {formatDate(dateObj.endDate)}
                      </span>
                      {dateObj.isFlexible && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          Flexible
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiation History */}
            {invitation.negotiationHistory?.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-3">
                  {invitation.negotiationHistory.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 capitalize">{item.actor}</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-600 capitalize">{item.action}</span>
                          <span className="text-sm text-gray-500">{formatDate(item.timestamp)}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>

            {invitation.status === 'pending' && (
              <>
                {invitation.college?.id && (
                  <button
                    onClick={() => router.push(`/profile/college/${invitation.college.id}`)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View College Profile
                  </button>
                )}
                {invitation.recruiter?.id && (
                  <button
                    onClick={() => router.push(`/profile/company/${invitation.recruiter.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Company Profile
                  </button>
                )}
                {invitation.student?.id && (
                  <button
                    onClick={() => router.push(`/profile/student/${invitation.student.id}`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View Student Profile
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationDetails;
