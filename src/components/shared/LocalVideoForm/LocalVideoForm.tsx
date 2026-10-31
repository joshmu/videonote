/**
 * @path /src/components/shared/LocalVideoForm/LocalVideoForm.tsx
 *
 * @project videonote
 * @file LocalVideoForm.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Thursday, 8th October 2020
 * @modified Sunday, 22nd November 2020 3:27:07 pm
 * @copyright © 2020 - 2020 MU
 */

import { LocalVideoLoader } from "./LocalVideoLoader";

export const LocalVideoForm = ({ handleVideoSrc }) => (
  <>
    <div className="h-10 mx-auto">
      <LocalVideoLoader handleVideoSrc={handleVideoSrc} />
    </div>
    <p className="text-xs text-themeText2">
      A video file from your computer can't be shared, and you pick it again each session.
    </p>
  </>
);
