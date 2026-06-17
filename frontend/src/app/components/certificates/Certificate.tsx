import { forwardRef } from 'react';
import { Award, BadgeCheck } from 'lucide-react';

interface CertificateProps {
  learnerName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  authorityName: string;
  authorityTitle: string;
  organizationLogo?: string | null;
}

const Certificate = forwardRef<HTMLDivElement, CertificateProps>(
  ({ learnerName, courseName, completionDate, certificateId, authorityName, authorityTitle, organizationLogo }, ref) => {
    return (
      <div 
        ref={ref}
        className="relative w-[1123px] h-[794px] bg-white shadow-2xl print:shadow-none mx-auto"
        style={{ pageBreakAfter: 'always' }}
      >
        {/* Decorative Corner Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-[#1e3a5f]"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-[#1e3a5f]"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-[#1e3a5f]"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-[#1e3a5f]"></div>

        {/* Decorative Inner Border */}
        <div className="absolute inset-8 border-2 border-slate-200"></div>

        {/* Organization Logo - Top Right */}
        {organizationLogo && (
          <div className="absolute top-12 right-12 w-20 h-20 rounded-lg overflow-hidden bg-white shadow-lg border-2 border-slate-200 z-20">
            <img 
              src={organizationLogo} 
              alt="Organization Logo" 
              className="w-full h-full object-contain p-1"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full px-24 py-16">
          
          {/* Header Section */}
          <div className="flex flex-col items-center space-y-6">
            {/* Default Logo Placeholder (only shown when no organization logo) */}
            {!organizationLogo && (
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2c5f8d] shadow-lg">
                <Award className="w-12 h-12 text-white" />
              </div>
            )}

            {/* Decorative Line */}
            <div className="flex items-center gap-3">
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#c9a961] to-[#c9a961]"></div>
              <div className="w-3 h-3 rounded-full bg-[#c9a961]"></div>
              <div className="w-32 h-px bg-gradient-to-l from-transparent via-[#c9a961] to-[#c9a961]"></div>
            </div>

            {/* Certificate Title */}
            <div className="text-center">
              <h1 className="text-6xl tracking-wider text-[#1e3a5f] font-serif font-bold">
                CERTIFICATE
              </h1>
              <p className="mt-3 text-2xl tracking-widest text-slate-500">
                OF COMPLETION
              </p>
            </div>
          </div>

          {/* Body Section */}
          <div className="flex flex-col items-center space-y-10 text-center max-w-4xl">
            {/* Completion Statement */}
            <p className="text-xl text-slate-600 leading-relaxed">
              This is to certify that
            </p>

            {/* Learner Name */}
            <div className="relative">
              <h2 className="text-6xl font-serif text-[#1e3a5f] px-12 font-bold">
                {learnerName}
              </h2>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent w-96 mx-auto"></div>
            </div>

            {/* Course Description */}
            <div className="space-y-4">
              <p className="text-xl text-slate-600">
                has successfully completed the course
              </p>
              <h3 className="text-3xl font-bold text-[#2c5f8d] px-8">
                {courseName}
              </h3>
              <p className="text-lg text-slate-500">
                through our Learning Management System
              </p>
            </div>
          </div>

          {/* Footer Section */}
          <div className="w-full">
            <div className="grid grid-cols-3 items-end gap-12">
              {/* Date Column */}
              <div className="flex flex-col items-center space-y-3">
                <p className="text-sm text-slate-500 uppercase tracking-wider">
                  Date of Completion
                </p>
                <p className="text-lg font-semibold text-[#1e3a5f]">
                  {completionDate}
                </p>
              </div>

              {/* Seal Column */}
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2c5f8d] shadow-lg">
                  <BadgeCheck className="w-16 h-16 text-[#c9a961]" />
                  <div className="absolute inset-3 rounded-full border-2 border-[#c9a961] border-dashed"></div>
                </div>
              </div>

              {/* Signature Column */}
              <div className="flex flex-col items-center space-y-3">
                <div className="mb-2">
                  <div className="w-56 h-16 flex items-center justify-center">
                    <span className="text-4xl font-serif italic text-[#1e3a5f]">
                      {authorityName.split(' ')[0]} {authorityName.split(' ').slice(-1)[0]}
                    </span>
                  </div>
                  <div className="w-56 h-px bg-slate-400 mt-1"></div>
                </div>
                <p className="text-base font-semibold text-[#1e3a5f]">
                  {authorityName}
                </p>
                <p className="text-sm text-slate-500">
                  {authorityTitle}
                </p>
              </div>
            </div>

            {/* Certificate ID */}
            <div className="mt-12 text-center">
              <p className="text-sm text-slate-400 tracking-widest">
                CERTIFICATE ID: <span className="font-mono">{certificateId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Watermark Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, #1e3a5f 0px, #1e3a5f 1px, transparent 1px, transparent 20px)`,
          }}></div>
        </div>
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';

export default Certificate;
