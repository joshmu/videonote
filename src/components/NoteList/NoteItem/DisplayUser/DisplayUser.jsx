// The author label: their public username, else their role; a note with no author is a guest's.
const DisplayUser = ({ author, own = false }) => {
  // no label on the viewer's own notes
  if (own) return <></>;

  const displayName = author?.username || author?.role || "guest";

  return (
    <div className="absolute bottom-0 right-1 text-themeText2">
      <div className="text-xs">{displayName.toLowerCase()}</div>
    </div>
  );
};

export default DisplayUser;
