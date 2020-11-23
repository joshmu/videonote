# todo

## priority

- [ ] detect new user on signin and defer to register modal

  > > check cookies

- [ ] add about information to /hello

  > > add videonote video promo

- [ ] create docker instance for demo purposes

- [ ] double check alert for local video when it begins to fail

  > > in general handling notifications when local video is used

- [ ] think more about mobile variant
- [ ] dev > logging of client errors? sentry?
- [ ] refresh token > use prompt to user > did you want to extend the session? use an interval timer for this

## quick

- [ ] sidebarWidth specification via settings modal
- [ ] playback speed in settings and smartcontrol shortcut with '<' '>' (DB)
- [ ] unify text with text components
- [ ] project last updated in the listing
- [ ] page route resets notifications

## wish list

- [ ] handle an audio file instead of a video file?
- [ ] realtime passing of notes, multi user, data flow back to current project rather than projects listing?
- [ ] can we access video thumbnails? project selection includes video thumbnail? (only for url based videos)

- [ ] options dropdown allow to scroll down list with keypress
- [ ] options dropdown to position against side of viewport so it is visible via shortcut in full screen mode

- [ ] video file extension warnings... mkv (no audio)

- [ ] if date-fns doesn't serve us for the timer duration then just make our own

- [ ] insert an accept cookies msg? or should we avoid cookies so we don't need this?

- [x] offer restrictation on sharing to avoid other users adding their own notes (editable) (DB)
- [x] offer public url however password protected (DB)
- [ ] more user friendly sharing? project title instead? (and when clash then add random suffix?) or half id? unique project title specifically for sharing?

- [ ] edit timestamp

- [ ] mute option

- [ ] option to change password
- [ ] forget password option?

- [ ] speech to text synthesis on actionInput

- [ ] naming scheme which can cover using audio?

- [ ] undo action for deleted projects and notes?

- [ ] multi users per project > check project usersIds before removing a project from db (DB: primary owner, who can also have extended control?) Multi users will have the project in their collection

- [ ] initialSidebarWidth based on user screen size
- [x] mark the video time line where notes are placed
- [x] when selecting timestamp edit then type or drag video playhead to change
  > > clicking in timeline instead
- [ ] offer ability to reply to a note? (DB)
- [ ] multiple export formats (excel, pdf, word, local to import back in to vn?, reminders/notes ios checklist?)

- [ ] utilize shared storage? google drive? should we remove our own db dependency entirely!? then there would be very little overhead

- [ ] notes have ability to add canvas mark?

- [ ] realtime websockets data layer? users in the same project can unify their data, control video in realtime with each other? open video call? see canvas drawings or atleast each others cursor?

- [x] after registration the intro blank page could use more UI
- [ ] error on emtpy create (shown in toast) - maybe show error in the dialog/modal form
- [ ] teams, sharing notes with team

- [ ] mobile can still be used and when not sure of a note then select and it plays the video at the position required. (workflow of flicking between)
- [ ] demo video = the videonote workflow... (explain the ease of note taking whilst video is running by having a playback offset, otherwise the simplicity of toggle and note flow)

- [ ] can we use localStorage to save screenshots of video timestamp positions? use this in export feature

- [ ] browser cross compatability of video files...

- [ ] welcome email when joining videonote
