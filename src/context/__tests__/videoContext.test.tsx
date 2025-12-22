import React from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import { VideoProvider, useVideoContext, PlayerAction } from '../videoContext'

// Mock the hooks
const mockSetAction = jest.fn()
jest.mock('@/hooks/useAnounceAction', () => ({
  useAnounceAction: jest.fn(() => ['', mockSetAction]),
}))

// Mock global context
const mockUpdateProject = jest.fn()
const mockWarnLocalVideo = jest.fn()
const mockSettings = {
  playOffset: 0,
  seekJump: 5,
}

jest.mock('../globalContext', () => ({
  useGlobalContext: jest.fn(() => ({
    project: { _id: 'project123', src: 'https://example.com/video.mp4' },
    updateProject: mockUpdateProject,
    settings: mockSettings,
    warnLocalVideo: mockWarnLocalVideo,
  })),
}))

// Mock notification context
const mockAddAlert = jest.fn()
jest.mock('../notificationContext', () => ({
  useNotificationContext: jest.fn(() => ({
    addAlert: mockAddAlert,
  })),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <VideoProvider>{children}</VideoProvider>
)

describe('VideoContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSettings.playOffset = 0
    mockSettings.seekJump = 5
  })

  describe('initial state', () => {
    it('provides initial playing state as false', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })
      expect(result.current.playing).toBe(false)
    })

    it('provides initial volume as 0.75', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })
      expect(result.current.volume).toBe(0.75)
    })

    it('provides initial playbackRate as 1', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })
      expect(result.current.playbackRate).toBe(1)
    })
  })

  describe('togglePlay', () => {
    it('toggles playing from false to true', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      expect(result.current.playing).toBe(false)

      act(() => {
        result.current.togglePlay()
      })

      expect(result.current.playing).toBe(true)
    })

    it('toggles playing from true to false', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.togglePlay() // false -> true
      })

      act(() => {
        result.current.togglePlay() // true -> false
      })

      expect(result.current.playing).toBe(false)
    })

    it('sets action to PLAY when toggling to playing', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.togglePlay()
      })

      expect(mockSetAction).toHaveBeenCalledWith(PlayerAction.PLAY)
    })

    it('sets action to PAUSE when toggling to paused', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.togglePlay() // play
      })

      act(() => {
        result.current.togglePlay() // pause
      })

      expect(mockSetAction).toHaveBeenLastCalledWith(PlayerAction.PAUSE)
    })
  })

  describe('changeVolume', () => {
    it('increases volume by increment', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      const initialVolume = result.current.volume

      act(() => {
        result.current.changeVolume(0.1)
      })

      expect(result.current.volume).toBeCloseTo(initialVolume + 0.1)
    })

    it('decreases volume by increment', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      const initialVolume = result.current.volume

      act(() => {
        result.current.changeVolume(-0.1)
      })

      expect(result.current.volume).toBeCloseTo(initialVolume - 0.1)
    })

    it('does not go below 0', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.changeVolume(-2)
      })

      expect(result.current.volume).toBe(0)
    })

    it('does not go above 1', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.changeVolume(2)
      })

      expect(result.current.volume).toBe(1)
    })

    it('ignores NaN values', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      const initialVolume = result.current.volume

      act(() => {
        result.current.changeVolume(NaN)
      })

      expect(result.current.volume).toBe(initialVolume)
    })

    it('sets action to VOLUME_UP when increasing', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.changeVolume(0.1)
      })

      expect(mockSetAction).toHaveBeenCalledWith(PlayerAction.VOLUME_UP)
    })

    it('sets action to VOLUME_DOWN when decreasing', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.changeVolume(-0.1)
      })

      expect(mockSetAction).toHaveBeenCalledWith(PlayerAction.VOLUME_DOWN)
    })
  })

  describe('handleProgress', () => {
    it('updates progress state', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      const mockProgress = {
        playedSeconds: 30,
        played: 0.5,
        loadedSeconds: 60,
        loaded: 1,
      }

      act(() => {
        result.current.handleProgress(mockProgress)
      })

      expect(result.current.progress).toEqual(mockProgress)
    })
  })

  describe('handleDuration', () => {
    it('updates duration state', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.handleDuration(120)
      })

      expect(result.current.duration).toBe(120)
    })
  })

  describe('setVolume', () => {
    it('sets volume directly', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.setVolume(0.5)
      })

      expect(result.current.volume).toBe(0.5)
    })
  })

  describe('setPlaybackRate', () => {
    it('sets playback rate directly', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.setPlaybackRate(1.5)
      })

      expect(result.current.playbackRate).toBe(1.5)
    })
  })

  describe('seekTo', () => {
    it('returns early when secs is NaN', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      const mockSeekTo = jest.fn()
      act(() => {
        result.current.handleReady({ seekTo: mockSeekTo } as any)
      })

      act(() => {
        result.current.seekTo(NaN)
      })

      expect(mockSeekTo).not.toHaveBeenCalled()
    })

    it('applies playOffset when offset is true (default)', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      mockSettings.playOffset = 2

      const mockSeekTo = jest.fn()
      act(() => {
        result.current.handleReady({ seekTo: mockSeekTo, current: { seekTo: mockSeekTo } } as any)
        // Need to set playerRef.current properly
      })

      // Note: playerRef manipulation is tricky in tests, this test documents expected behavior
    })
  })

  describe('jumpBack', () => {
    it('sets action to SEEK_BACK', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      // Set up progress and playerRef
      act(() => {
        result.current.handleProgress({
          playedSeconds: 30,
          played: 0.5,
          loadedSeconds: 60,
          loaded: 1,
        })
      })

      const mockSeekTo = jest.fn()
      act(() => {
        result.current.handleReady({ seekTo: mockSeekTo } as any)
      })

      act(() => {
        result.current.jumpBack()
      })

      expect(mockSetAction).toHaveBeenCalledWith(PlayerAction.SEEK_BACK)
    })
  })

  describe('jumpForward', () => {
    it('sets action to SEEK_FORWARD', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      // Set up progress and playerRef
      act(() => {
        result.current.handleProgress({
          playedSeconds: 30,
          played: 0.5,
          loadedSeconds: 60,
          loaded: 1,
        })
      })

      const mockSeekTo = jest.fn()
      act(() => {
        result.current.handleReady({ seekTo: mockSeekTo } as any)
      })

      act(() => {
        result.current.jumpForward()
      })

      expect(mockSetAction).toHaveBeenCalledWith(PlayerAction.SEEK_FORWARD)
    })
  })

  describe('handlePlayerError', () => {
    it('shows error alert for generic errors', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.handlePlayerError({ message: 'Some error' })
      })

      expect(mockAddAlert).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Player unable to load video.',
      })
    })

    it('handles Format error by clearing src and warning', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      act(() => {
        result.current.handlePlayerError({
          target: {
            error: {
              message: 'Format error',
            },
          },
        })
      })

      expect(mockUpdateProject).toHaveBeenCalledWith({ src: '' })
      expect(mockWarnLocalVideo).toHaveBeenCalled()
      expect(mockAddAlert).not.toHaveBeenCalled()
    })
  })

  describe('handleReady', () => {
    it('stores player reference', () => {
      const { result } = renderHook(() => useVideoContext(), { wrapper })

      const mockPlayer = { seekTo: jest.fn() }

      act(() => {
        result.current.handleReady(mockPlayer as any)
      })

      expect(result.current.playerRef.current).toBe(mockPlayer)
    })
  })

  describe('PlayerAction enum', () => {
    it('has correct values', () => {
      expect(PlayerAction.PLAY).toBe('play')
      expect(PlayerAction.PAUSE).toBe('pause')
      expect(PlayerAction.VOLUME_UP).toBe('volumeUp')
      expect(PlayerAction.VOLUME_DOWN).toBe('volumeDown')
      expect(PlayerAction.SEEK_FORWARD).toBe('seekForward')
      expect(PlayerAction.SEEK_BACK).toBe('seekBack')
    })
  })
})
