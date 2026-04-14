/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameCanvas } from './components/GameCanvas';
import { UI } from './components/UI';
import { SingleSwitchController } from './components/SingleSwitchController';

export default function App() {
  return (
    <div className="relative w-full h-screen overflow-hidden select-none touch-none bg-black">
      <GameCanvas />
      <UI />
      <SingleSwitchController />
    </div>
  );
}
