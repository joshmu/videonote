import { useState } from "react";

import { ModalType } from "@/components/Modals/Modals";
import { useProjectsContext } from "@/context/projectsContext";
import { useSessionContext } from "@/context/sessionContext";
import { useUiShellContext } from "@/context/uiShellContext";
import { ModalPrimaryBtn } from "@/shared/Modal/ModalBtn";
import { Heading2 } from "@/shared/Text/Text";

// Big Buck Bunny, (c) Blender Foundation, CC BY 3.0, on Blender's own channel
const SAMPLE_PROJECT = {
  title: "Sample: Big Buck Bunny",
  src: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
};

// A signed-in User with no Project yet has nothing else on screen to act on.
export const FirstProjectPrompt = () => {
  const { admin } = useSessionContext();
  const { project, createProject } = useProjectsContext();
  const { toggleModalOpen } = useUiShellContext();
  const [creatingSample, setCreatingSample] = useState(false);

  if (!admin || project) return null;

  const trySample = async () => {
    setCreatingSample(true);
    await createProject(SAMPLE_PROJECT);
    setCreatingSample(false);
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
      <Heading2>Start with a video</Heading2>
      <p className="max-w-sm text-themeText2">
        Create a Project from a link, then add a timestamped Note whenever something needs a change.
      </p>
      <ModalPrimaryBtn handleClick={() => toggleModalOpen(ModalType.CREATE_PROJECT)}>
        Create Project
      </ModalPrimaryBtn>
      <button
        type="button"
        className="mt-4 text-sm underline underline-offset-4 cursor-pointer text-themeText2 hover:text-themeAccent"
        disabled={creatingSample}
        onClick={trySample}
      >
        Or try a sample video
      </button>
    </div>
  );
};
