// Secure member data - this will be bundled into the app, not publicly accessible
export const MEMBER_CSV_DATA = `Contact: First name,Contact: Last name,Contact: Email,Where are most of your events taking place?,Number Of Bookings Per Year,Number of freelancers you regularly work with,Referred by,What best describes how you feel about your business?,What is your biggest goal for this year?,What range do most of your clients' budgets fall into?,What was your average revenue per booking last year?,When did you start the company?,Which of the following best describes your current networking strategy?,Which of the following is most important to you when it comes to Freeda?,Years Within Industry,Company Founded Date,Customer Description,Do you have significant hard costs in your business?,Industry Category,Number of Bookings Per Year,Type of Bookings,Your company's approximate annual net revenue?,Company Name,Website,Mailing Address,Mailing Address Line 2,"City, State",Zip Code,Country,Deal Name,Deal Amount,Application Status,Membership Start Date,Membership End Date,Deal Stage,Pipeline,Notes from Interview,Group Number ,Group Status,WhatsApp Group Link`;

// This function will load the CSV data securely
export async function loadSecureMemberData(): Promise<string> {
  // Return empty CSV data - all member data has been removed for privacy
  return MEMBER_CSV_DATA;
} 