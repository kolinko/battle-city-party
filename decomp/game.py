pad_current = 0x0006
pad_pressed = 0x0008
frame_high = 0x000a
frame_low = 0x000b
vram_cursor = 0x000c
sprite_cursor = 0x000d
rng_state = 0x000f
game_mode = 0x0046
lives = 0x0051
paused = 0x006d
two_players = 0x0083
stage = 0x0085
tank_x = 0x0090
tank_y = 0x0098
tank_state = 0x00a0
tank_attributes = 0x00a8
bullet_x = 0x00b8
bullet_y = 0x00c2
bullet_state = 0x00cc
ppu_control = 0x2000
ppu_mask = 0x2001
ppu_status = 0x2002
ppu_scroll = 0x2005
ppu_address = 0x2006
ppu_data = 0x2007
sprite_dma = 0x4014
controller_strobe = 0x4016
bullet_impact = 0x00d6
bullet_dx_table = 0xe46c
bullet_dy_table = 0xe470
step_dx_table = 0xea49
step_dy_table = 0xea4d
loop_slot = 0x005a
loop_inner = 0x005b
scratch = 0x0000
powerup_x = 0x0086
powerup_y = 0x0087
powerup_type = 0x0088
control_cooldown = 0x006f
powerup_cooldown = 0x0062
probe_x = 0x0047
probe_y = 0x0048
delta_x = 0x0064
delta_y = 0x0065
step_sign_x = 0x0054
step_sign_y = 0x0055
tank_flags = 0x0103
nametable_base_offset = 0x0005
generic_map_vram_source_pointers = 0x0011
two_seven_digit_score_records = 0x0015
score_addend_digits = 0x0035
maximum_score_digits = 0x003d
transition_menu_and_ppu_phase_state = 0x0045
scroll_y_and_ppu_control_shadow = 0x004f
sprite_tile = 0x0053
title_cursor_or_tank_direction = 0x005c
text_tile_offset = 0x0060
vram_row_fill_mode = 0x0063
extra_life_award_latches = 0x0066
round_effect_and_enemy_spawn_state = 0x0068
enemy_spawn_start_slot = 0x006c
sprite_attribute_enable_mask = 0x006e
target_x_target_y = 0x0071
stage_results_counts_and_totals = 0x0073
enemies_remaining_to_spawn = 0x007f
title_repeat_and_enemy_spawn_delay = 0x0081
enemy_spawn_timing_parameter = 0x0084
hit_immunity_timer = 0x0089
stage_parameter_bytes = 0x008b
enemy_attribute_script_index = 0x008f
tank_sprite_phase_or_flip = 0x00b0
cached_tank_tile_pointers_and_flags = 0x00e0
audio_state_workspace = 0x00f0
enemy_fire_suppression_timer = 0x0100
transition_sprite_state = 0x0105
configuration_signature_ram = 0x0110
vram_command_buffer = 0x0180
oam_shadow = 0x0200
audio_commands_and_event_flags = 0x0300
map_collision_workspace = 0x0400
work_x = 0x0056
work_y = 0x0057
work_step_x = 0x0058
work_step_y = 0x0059
aim_direction_states = 0xe486
demo_pad_bits_by_direction = 0xc6c2
title_tank_step_x_table = 0xd3d5
title_tank_step_y_table = 0xd3d9
AIM_TABLE_ALTERNATE_ROW = 9
stage_enemy_attributes_table = 0xe4ec
stage_enemy_counts_table = 0xe578
record tanks: state=tank_state, x=tank_x, y=tank_y, attributes=tank_attributes, flags=tank_flags
record projectiles: state=bullet_state, x=bullet_x, y=bullet_y, modifier=bullet_impact
FIRE_BUTTONS = 0x03
RIGHT = 0x80
LEFT = 0x40
DOWN = 0x20
UP = 0x10
START = 0x08
SELECT = 0x04
BUTTON_B = 0x02
BUTTON_A = 0x01
DIR_UP = 0x00
DIR_LEFT = 0x01
DIR_DOWN = 0x02
DIR_RIGHT = 0x03
NO_DIRECTION = 0xff


PLAYER_SLOTS = 0x02
SFX_PLAYER_FIRE = 0x0f
DIRECTION_MASK = 0x03
PROJECTILE_FLYING = 0x40
PROJECTILE_PLAIN = 0x00
PROJECTILE_SECOND_MOVE = 0x01
PROJECTILE_CLEAR_CELL = 0x02
PROJECTILE_SECOND_MOVE_AND_CLEAR_CELL = 0x03
TANK_CLASS_MASK = 0xf0
TANK_CLASS_BASIC = 0x00
TANK_CLASS_60 = 0x60
TANK_CLASS_C0 = 0xc0
TANK_CLASS_BIT7 = 0x80

SELECTOR_ENABLED = 0x5a
SECONDARY_SHOT_MASK = 0xc0
SECONDARY_SHOT_CLASS = 0x40
view world: frame=frame_low, slow_frame=frame_high, stage=stage, mode=game_mode, paused=paused, two_players=two_players
view round_state: base_state=round_effect_and_enemy_spawn_state, enemies_remaining=enemies_remaining_to_spawn, spawn_delay=0x0082, spawn_interval=enemy_spawn_timing_parameter, enemy_freeze=enemy_fire_suppression_timer, spawn_lane=0x006a
view stage_flow: delay=transition_menu_and_ppu_phase_state, menu_selection=0x004a, title_phase=0x004b, ready=0x004c, fade=0x004d
view pickup: x=powerup_x, y=powerup_y, kind=powerup_type, cooldown=powerup_cooldown
view video: tile=sprite_tile, attributes=0x0004, attribute_mask=sprite_attribute_enable_mask, text_offset=text_tile_offset, background_bank=nametable_base_offset
view transition: x=transition_sprite_state, y=0x0106, direction=0x0107, lifetime=0x0108
view selectors: raw_013d=0x013d, raw_013e=0x013e
record input_state: held=pad_current, pressed=pad_pressed

TANK_HIT_AXIS_LIMIT = 10
PROJECTILE_AXIS_LIMIT = 6
PICKUP_AXIS_LIMIT = 12

PROJECTILE_IMPACT_START = 0x33
TANK_EXPLOSION_START = 0x73
PLAYER_STUN_COUNT = 0xc8
SFX_PLAYER_DESTROYED = 7
SFX_ENEMY_DESTROYED = 10
SFX_ENEMY_ARMOR_HIT = 14

def is_player_projectile(slot):
    return not (slot & 6)

def is_flying_projectile(state):
    return high_nibble(state) == PROJECTILE_FLYING

def projectile_belongs_to_player(player, projectile):
    return ((player ^ projectile) & 1) == 0

def enemy_score_class(attributes):
    class_bits = shift_byte_right_5_value(attributes)
    unwrapped_index = class_bits - 4
    class_index = byte(class_bits - 4)
    return class_index

def byte_axis_distance(first, second):
    distance = byte(first - second)
    if ((first - second) & 0x80) != 0:
        distance = byte((distance ^ 0xff) + 1)
        return distance
    return distance

def add_decimal_digit(addend, digit, carry_in):
    if ((byte(addend + digit + carry_in) - 10) & 0x80) != 0:
        digit_out = byte(addend + digit + carry_in)
        carry_out: int = 0
    else:
        digit_out = byte(byte(addend + digit + carry_in) - 10)
        carry_out: int = 1
    return digit_out, carry_out

def take_high_bit(value):
    bit = value >> 7
    remaining = byte(value << 1)
    return bit, remaining

def enemy_projectile_slots_reverse():
    return byte_slots(loop_inner, 8, 2)

def player_slots_reverse():
    return byte_slots(loop_slot, 2)

def tank_slots_reverse():
    return byte_slots(loop_slot, 8)

def projectile_slots_reverse():
    return byte_slots(loop_slot, 10)

def play_stage_until_finished():
    while True:
        wait_next_frame()
        pause_flag = world.paused
        if pause_flag == 0:
            update_gameplay()
        update_powerup_lifetime_and_render()
        dispatch_bullet_render_handlers()
        dispatch_all_eight_tank_render_handlers()
        pressed4 = ram[pad_pressed]
        if pressed4 & 8:
            mem_6d = world.paused
            world.paused = 1 ^ mem_6d
            ram[audio_commands_and_event_flags] = 1 ^ mem_6d
        draw_unpaused_frame_phase_sprites()
        round_finished = return_round_continuation_status()
        if round_finished != 0:
            break

def run_stage_campaign():
    while True:
        wait_next_frame()
        audio_reset()
        video.background_bank = 0x1c
        ram[scroll_y_and_ppu_control_shadow] = 0
        scroll_y_and_ppu_control_shadow[1] = 0
        world.paused = 0
        stage_flow.fade = 4
        animate_constant_vram_rows_incrementing()
        while True:
            queue_stage_value_vram_update()
            value5 = stage_flow.ready
            if value5 == 0:
                pressed = ram[pad_pressed]
                if pressed & 8:
                    break
            else:
                break
            pressed2 = ram[pad_pressed]
            if pressed2 & 1:
                world.frame = 0
                value = byte(world.stage + 1)
                world.stage = value
                stage_number = world.stage
                if stage_number == 0x24:
                    world.stage = 0x23
                    continue
            else:
                held = ram[pad_current]
                if not (held & 1):
                    pressed3 = ram[pad_pressed]
                    if pressed3 & 2:
                        world.frame = 0
                        value = byte(world.stage - 1)
                        world.stage = value
                        if value == 0:
                            world.stage = 1
                            continue
                    else:
                        held2 = ram[pad_current]
                        if held2 & 2:
                            frame2 = world.frame
                            if not (frame2 & 7):
                                world.frame = 0
                                value = byte(world.stage - 1)
                                world.stage = value
                                if value == 0:
                                    world.stage = 1
                                    continue
                else:
                    frame = world.frame
                    if frame & 7:
                        pressed3 = ram[pad_pressed]
                        if pressed3 & 2:
                            world.frame = 0
                            value = byte(world.stage - 1)
                            world.stage = value
                            if value == 0:
                                world.stage = 1
                                continue
                        else:
                            held2 = ram[pad_current]
                            if held2 & 2:
                                frame2 = world.frame
                                if not (frame2 & 7):
                                    world.frame = 0
                                    value = byte(world.stage - 1)
                                    world.stage = value
                                    if value == 0:
                                        world.stage = 1
                                        continue
                    else:
                        world.frame = 0
                        value = byte(world.stage + 1)
                        world.stage = value
                        stage_number = world.stage
                        if stage_number == 0x24:
                            world.stage = 0x23
                            continue
        audio_commands_and_event_flags[1] = 1
        audio_commands_and_event_flags[2] = 1
        audio_commands_and_event_flags[3] = 1
        value18 = stage_flow.title_phase
        if value18 != 0:
            queue_masked_status_vram_update()
        else:
            initialize_map_render_workspace()
            stage_number2 = world.stage
            load_stage_map(value=stage_number2)
            queue_status_vram_update()
        ram[vram_cursor] = 0
        queue_playfield_tail_block_to_vram()
        animate_pointer_vram_rows_decrementing()
        stage_flow.fade = 0
        wait_next_frame()
        initialize_stage_round()
        play_stage_until_finished()
        world.slow_frame = 0
        world.frame = 0
        audio_commands_and_event_flags[17] = 0
        audio_commands_and_event_flags[18] = 0
        flags = transition.lifetime
        if flags != 0:
            world.slow_frame = 0xfe
        while True:
            wait_next_frame()
            clear_input_when_base_state_armed()
            update_gameplay()
            update_powerup_lifetime_and_render()
            dispatch_all_eight_tank_render_handlers()
            dispatch_bullet_render_handlers()
            set_palette_fade_phase_from_frame()
            frame_hi = world.slow_frame
            if frame_hi == 2:
                break
        audio_reset()
        run_four_slot_counter_display_loop()
        value = byte(world.stage + 1)
        world.stage = value
        stage_number3 = world.stage
        if stage_number3 == 0x47:
            world.stage = 1
            world.mode = 0
        stage_number4 = world.stage
        if stage_number4 == 0x24:
            world.mode = 1
        life_count = ram[lives]
        mem_52 = ram[0x52]
        if (byte(life_count + mem_52)) == 0:
            break
        value32 = round_state.base_state
        if value32 != 0x80:
            break
        continue
    run_flag_0318_wait_transition()
    high_score_winner = compare_and_conditionally_copy_two_7byte_arrays()
    if high_score_winner != 0:
        run_flag_0315_wait_transition()
        run_transition_cleanup_calls()
    draw_title()
    stage_flow.title_phase = 0
    while True:
        reset_display_and_draw_common_screen()
        wait_for_title_start_select_or_timeout()
        choose_game_mode()
        configure_demo_mode_setup()
        main_game_loop()
        continue

def is_active_tank(state):
    return (state & 0x80) and state < 0xe0

def projectile_has_second_step(modifier):
    return modifier & PROJECTILE_SECOND_MOVE

def projectile_clears_cell(modifier):
    return modifier & PROJECTILE_CLEAR_CELL

def apply_projectile_traits(slot, attributes):
    tank_class = attributes & TANK_CLASS_MASK
    if tank_class == TANK_CLASS_BASIC:
        return
    elif tank_class == TANK_CLASS_C0:
        set_projectile_modifier(slot, PROJECTILE_SECOND_MOVE)
        return PROJECTILE_SECOND_MOVE
    elif tank_class == TANK_CLASS_60:
        set_projectile_modifier(slot, PROJECTILE_SECOND_MOVE_AND_CLEAR_CELL)
        return
    elif not (tank_class & TANK_CLASS_BIT7):
        set_projectile_modifier(slot, PROJECTILE_SECOND_MOVE)
        return PROJECTILE_SECOND_MOVE
    return

def shift_byte_left_2(value):
    overflow_1 = (value) >> 7
    shifted_1 = byte((value) << 1)
    overflow_2 = (byte((value) << 1)) >> 7
    return byte((value) << 2)

def shift_byte_left_4(value):
    overflow_1 = (value) >> 7
    shifted_1 = byte((value) << 1)
    overflow_2 = (byte((value) << 1)) >> 7
    shifted_2 = byte((value) << 2)
    overflow_3 = (byte((value) << 2)) >> 7
    shifted_3 = byte((value) << 3)
    overflow_4 = (byte((value) << 3)) >> 7
    return byte((value) << 4)

def shift_byte_left_1(value):
    overflow_1 = (value) >> 7
    return byte((value) << 1)

def shift_byte_right_1(value):
    overflow_1 = (value) & 1
    return (value) >> 1

def double_byte_sum(left, right):
    overflow_1 = byte(left + right) >> 7
    return byte(byte(left + right) << 1)

def shift_byte_left_3(value):
    overflow_1 = (value) >> 7
    shifted_1 = byte((value) << 1)
    overflow_2 = (byte((value) << 1)) >> 7
    shifted_2 = byte((value) << 2)
    overflow_3 = (byte((value) << 2)) >> 7
    return byte((value) << 3)

def shift_byte_left_4_value(value):
    overflow_1 = (value) >> 7
    shifted_1 = byte((value) << 1)
    overflow_2 = (byte((value) << 1)) >> 7
    shifted_2 = byte((value) << 2)
    overflow_3 = (byte((value) << 2)) >> 7
    shifted_3 = byte((value) << 3)
    overflow_4 = (byte((value) << 3)) >> 7
    shifted_4 = byte((value) << 4)
    return shifted_4

def shift_byte_left_1_value(value):
    overflow_1 = (value) >> 7
    shifted_1 = byte((value) << 1)
    return shifted_1

def shift_byte_left_2_value(value):
    overflow_1 = (value) >> 7
    shifted_1 = byte((value) << 1)
    overflow_2 = (byte((value) << 1)) >> 7
    shifted_2 = byte((value) << 2)
    return shifted_2

def snap_to_tile_grid(position):
    centered = byte(position + 4)
    return (position + 4) & 0xf8

def shift_byte_right_2(value):
    overflow_1 = (value) & 1
    shifted_1 = (value) >> 1
    overflow_2 = ((value) >> 1) & 1
    return (value) >> 2

def shift_byte_right_3_value(value):
    overflow_1 = (value) & 1
    shifted_1 = (value) >> 1
    overflow_2 = ((value) >> 1) & 1
    shifted_2 = (value) >> 2
    overflow_3 = ((value) >> 2) & 1
    shifted_3 = (value) >> 3
    return shifted_3

def shift_byte_right_3(value):
    overflow_1 = (value) & 1
    shifted_1 = (value) >> 1
    overflow_2 = ((value) >> 1) & 1
    shifted_2 = (value) >> 2
    overflow_3 = ((value) >> 2) & 1
    return (value) >> 3

def shift_byte_right_4(value):
    overflow_1 = (value) & 1
    shifted_1 = (value) >> 1
    overflow_2 = ((value) >> 1) & 1
    shifted_2 = (value) >> 2
    overflow_3 = ((value) >> 2) & 1
    shifted_3 = (value) >> 3
    overflow_4 = ((value) >> 3) & 1
    return (value) >> 4

def shift_byte_right_4_value(value):
    overflow_1 = (value) & 1
    shifted_1 = (value) >> 1
    overflow_2 = ((value) >> 1) & 1
    shifted_2 = (value) >> 2
    overflow_3 = ((value) >> 2) & 1
    shifted_3 = (value) >> 3
    overflow_4 = ((value) >> 3) & 1
    shifted_4 = (value) >> 4
    return shifted_4

def shift_byte_right_5_value(value):
    overflow_1 = (value) & 1
    shifted_1 = (value) >> 1
    overflow_2 = ((value) >> 1) & 1
    shifted_2 = (value) >> 2
    overflow_3 = ((value) >> 2) & 1
    shifted_3 = (value) >> 3
    overflow_4 = ((value) >> 3) & 1
    shifted_4 = (value) >> 4
    overflow_5 = ((value) >> 4) & 1
    shifted_5 = (value) >> 5
    return shifted_5

def shift_byte_left_3_value(value):
    overflow_1 = (value) >> 7
    shifted_1 = byte((value) << 1)
    overflow_2 = (byte((value) << 1)) >> 7
    shifted_2 = byte((value) << 2)
    overflow_3 = (byte((value) << 2)) >> 7
    shifted_3 = byte((value) << 3)
    return shifted_3

def shift_byte_right_1_value(value):
    overflow_1 = (value) & 1
    shifted_1 = (value) >> 1
    return shifted_1

def high_nibble(value):
    return value & 0xf0

def low_nibble(value):
    return value & 0x0f

def snap_to_tile(position):
    return (position + 4) & 0xf8

def byte(value):
    return value & 0xff

def direction_of(state):
    return state & DIRECTION_MASK

def flying(direction):
    return direction | PROJECTILE_FLYING

def eight_pixels(step):
    return byte(step << 3)

def is_player(slot):
    return slot < PLAYER_SLOTS

def play_sound(effect):
    audio_commands_and_event_flags[effect] = 1

def set_projectile_modifier(slot, kind):
    projectiles[slot].modifier = kind

def shift_byte_left_three(value):
    first_overflow = value >> 7
    doubled = byte(value << 1)
    second_overflow = byte(value << 1) >> 7
    quadrupled = byte(value << 2)
    third_overflow = byte(value << 2) >> 7
    return eight_pixels(value)

def place_projectile_ahead_of_tank(slot, direction):
    dx = bullet_dx_table[direction]
    offset_x = shift_byte_left_three(dx)
    x_pos = tanks[slot].x
    projectiles[slot].x = byte(offset_x + x_pos)
    dy = bullet_dy_table[direction]
    offset_y = shift_byte_left_three(dy)
    y_pos = tanks[slot].y
    projectiles[slot].y = byte(offset_y + y_pos)

def reset():
    disable_interrupts()
    a_value = 0x10
    ram[ppu_control] = 0x10
    slot = 2
    while True:
        ppu_status_value = ram[ppu_status]
        if not (ppu_status_value & 0x80):
            continue
        label block_c07e:
        a_value = 6
        ram[ppu_mask] = 6
        slot = byte(slot - 1)
        if slot == 0:
            break
    set_stack_pointer(0x7f)
    initialize_game()
    ram[scroll_y_and_ppu_control_shadow] = 0
    scroll_y_and_ppu_control_shadow[1] = 0
    wait_vblank_and_set_ppu_control()
    draw_title()
    stage_flow.title_phase = 0
    while True:
        reset_display_and_draw_common_screen()
        wait_for_title_start_select_or_timeout()
        choose_game_mode()
        configure_demo_mode_setup()
        main_game_loop()
        continue
    goto block_c07e

def run_transition_cleanup_calls():
    wait_vblank_and_disable_rendering()
    clear_ram_0400_07ff()
    repeat_d771_over_0400_to_07ff()
    wait_vblank_and_set_ppu_control()
    return

def clear_input_when_base_state_armed():
    value = round_state.base_state
    if value != 0x80:
        ram[pad_current] = 0
        input_state[1].held = 0
        ram[pad_pressed] = 0
        input_state[1].pressed = 0
    return

def initialize_score_slots_then_fall_through():
    clear_seven_bytes_set_ff_sentinel(base=0x15)
    clear_seven_bytes_set_ff_sentinel(base=0x1d)
    fall_into(initialize_new_game_state)

def initialize_new_game_state():
    ram[0x101] = 0
    ram[0x102] = 0
    ram[extra_life_award_latches] = 0
    extra_life_award_latches[1] = 0
    stage_flow.ready = 0
    ram[lives] = 3
    ram[0x52] = 3
    round_state.spawn_lane = 3
    two_player_game = world.two_players
    if two_player_game == 0:
        ram[0x52] = 0
    world.stage = 1
    world.mode = 0
    return 0

def update_gameplay():
    mark_tank_occupied_map_cells()
    apply_player_direction()
    tick_tank_states()
    clear_tank_occupied_map_cells()
    tick_projectile_motion()
    update_round_transition_countdowns_and_dispatch()
    update_tank_flash_rendering()
    player_fire_pressed()
    enemy_fire()
    tick_enemy_spawn()
    move_projectiles_and_terrain_impact()
    projectile_overlaps()
    projectile_tank_hits()
    check_powerup_pickup()
    step_and_draw_transition_sprite()
    update_0311_from_two_slot_idle_checks()
    render_lives_counter_rows()
    set_palette_fade_phase_from_frame()
    return

def set_palette_fade_phase_from_frame():
    frame = world.frame
    if not (frame & 0x3f):
        stage_flow.fade = 2
        return
    if (frame & 0x3f) != 0x20:
        return
    stage_flow.fade = 1
    return 1

def initialize_stage_round():
    clear_bullet_states()
    clear_tank_states_and_flags()
    transition.y = 0xf0
    transition.lifetime = 0
    life_count = ram[lives]
    if life_count != 0:
        initialize_tank_slot(slot=0)
    value4 = ram[0x52]
    if value4 != 0:
        initialize_tank_slot(slot=1)
    round_state.enemies_remaining = 0x14
    ram[0x80] = 0x14
    ram[enemy_attribute_script_index] = 0
    world.slow_frame = 0
    stage_flow.title_phase = 0
    stage_flow.delay = 0
    ram[control_cooldown] = 0
    control_cooldown[1] = 0
    ram[hit_immunity_timer] = 0
    hit_immunity_timer[1] = 0
    round_state.spawn_delay = 0
    pickup.x = 0
    round_state.enemy_freeze = 0
    round_state.spawn_lane = 0
    clear_results_counts()
    draw_even_d362_text_indices()
    wait_next_frame()
    draw_player_status_text()
    draw_stage_value_at_fixed_position()
    load_stage_parameters()
    round_state.base_state = 0x80
    audio_commands_and_event_flags[18] = 1
    stage_flow.ready = 1
    mode = world.mode
    if mode != 1:
        stage_number = world.stage
    else:
        stage_number = 0x23
    scaled_stage_number_0 = shift_byte_left_2(stage_number)
    ram[scratch] = scaled_stage_number_0
    scratch_value = ram[scratch]
    round_state.spawn_interval = byte(0xbe - scratch_value)
    two_player_game = world.two_players
    if two_player_game != 0:
        value15 = round_state.spawn_interval
        round_state.spawn_interval = byte(value15 - 20)
    return

def configure_demo_mode_setup():
    world.paused = 1
    stage_flow.fade = 0
    initialize_new_game_state()
    ram[0x52] = 3
    ram[scroll_y_and_ppu_control_shadow] = 0
    scroll_y_and_ppu_control_shadow[1] = 0
    world.slow_frame = 0
    world.frame = 0
    initialize_map_render_workspace()
    world.stage = 0xff
    load_stage_map(value=0xff)
    world.stage = 0x1e
    world.mode = 2
    wait_vblank_and_disable_rendering()
    ram[0x56] = 0x1a
    ram[0x57] = 0x46
    generic_map_vram_source_pointers[3] = 0xd2
    generic_map_vram_source_pointers[2] = 0x99
    process_consecutive_ff_source_entries()
    ram[0x56] = 0x3c
    ram[0x57] = 0x78
    generic_map_vram_source_pointers[3] = 0xd2
    generic_map_vram_source_pointers[2] = 0xa0
    process_consecutive_ff_source_entries()
    repeat_d771_over_0400_to_07ff()
    wait_vblank_and_set_ppu_control()
    initialize_stage_round()
    queue_status_vram_update()
    wait_next_frame()
    ram[enemy_spawn_start_slot] = 5
    return 5

def abandon_stage_return_address():
    return_low = pull()
    return_high = pull()

def main_game_loop():
    while True:
        wait_next_frame()
        pressed = ram[pad_pressed]
        if pressed & 0x0c:
            abandon_stage_return_address()
            ram[vram_cursor] = 0
            reset_display_and_draw_common_screen()
            while True:
                choose_game_mode()
                configure_demo_mode_setup()
                main_game_loop()
                reset_display_and_draw_common_screen()
                wait_for_title_start_select_or_timeout()
        refresh_controller_slots_from_target_probe()
        update_gameplay()
        update_powerup_lifetime_and_render()
        dispatch_all_eight_tank_render_handlers()
        dispatch_bullet_render_handlers()
        round_status = return_round_continuation_status()
        if round_status != 0:
            ram[vram_cursor] = 0
            return 0

def run_flag_0315_wait_transition():
    wait_vblank_and_disable_rendering()
    video.background_bank = 0x1c
    ram[scroll_y_and_ppu_control_shadow] = 0
    scroll_y_and_ppu_control_shadow[1] = 0
    clear_ram_0400_07ff()
    ram[0x56] = 0x10
    ram[0x57] = 0x32
    generic_map_vram_source_pointers[3] = 0xd2
    generic_map_vram_source_pointers[2] = 0xb5
    process_consecutive_ff_source_entries()
    configure_and_process_data_after_zero_prefix()
    repeat_d771_over_0400_to_07ff()
    wait_vblank_and_set_ppu_control()
    world.slow_frame = 0
    audio_commands_and_event_flags[21] = 1
    audio_commands_and_event_flags[22] = 1
    audio_commands_and_event_flags[23] = 1
    while True:
        wait_next_frame()
        frame = world.frame
        stage_flow.fade = (frame & 3) + 5
        value9 = audio_commands_and_event_flags[21]
        if value9 == 0:
            break
    stage_flow.fade = 0
    return 0

def run_timed_text_draw_sequence():
    wait_vblank_and_disable_rendering()
    video.background_bank = 0x1c
    ram[scroll_y_and_ppu_control_shadow] = 0
    scroll_y_and_ppu_control_shadow[1] = 0
    clear_ram_0400_07ff()
    repeat_d771_over_0400_to_07ff()
    wait_vblank_and_set_ppu_control()
    wait_for_frame_low_phase()
    wait_for_frame_low_phase()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x0f
    queue_ff_terminated_vram_string(tile_x=8, tile_y=8)
    wait_for_frame_low_phase()
    generic_map_vram_source_pointers[1] = 0xd2
    ram[generic_map_vram_source_pointers] = 0x84
    queue_ff_terminated_vram_string(tile_x=8, tile_y=0x0a)
    wait_for_frame_low_phase()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x34
    queue_ff_terminated_vram_string(tile_x=8, tile_y=0x0c)
    wait_for_frame_low_phase()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x4d
    queue_ff_terminated_vram_string(tile_x=8, tile_y=0x0e)
    wait_for_frame_low_phase()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x3f
    queue_ff_terminated_vram_string(tile_x=8, tile_y=0x10)
    wait_for_frame_low_phase()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x3f
    queue_ff_terminated_vram_string(tile_x=9, tile_y=0x10)
    wait_for_frame_low_phase()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x3f
    queue_ff_terminated_vram_string(tile_x=0x0a, tile_y=0x10)
    wait_for_frame_low_phase()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x3f
    queue_ff_terminated_vram_string(tile_x=0x0b, tile_y=0x10)
    wait_for_frame_low_phase()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x3f
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=0x10)
    animate_seven_step_sprite_scroll()
    wait_vblank_and_disable_rendering()
    initialize_map_render_workspace()
    repeat_d771_over_0400_to_07ff()
    wait_vblank_and_set_ppu_control()
    return

def wait_for_frame_low_phase():
    world.frame = 0
    while True:
        wait_next_frame()
        frame = world.frame
        if not (frame & 0x3f):
            break
    return frame & 0x3f

def animate_seven_step_sprite_scroll():
    ram[0x56] = 0x78
    ram[0x57] = 0x1e
    ram[loop_slot] = 0
    while True:
        draw_indexed_tile_at_generic_coordinates()
        draw_indexed_tile_at_generic_coordinates()
        draw_indexed_tile_at_generic_coordinates()
        draw_indexed_tile_at_generic_coordinates()
        value = byte(ram[loop_slot] + 1)
        ram[loop_slot] = value
        slot = ram[loop_slot]
        if slot == 7:
            break
    while True:
        wait_next_frame()
        value = byte(ram[0x57] + 1)
        ram[0x57] = value
        video.tile = 0x9d
        video.attributes = 1
        slot6 = ram[0x56]
        index5 = ram[0x57]
        emit_horizontal_sprite_pair(a=1, slot=slot6, index=index5)
        value6 = ram[0x57]
        if value6 == 0xf8:
            break
    return value6

def draw_indexed_tile_at_generic_coordinates():
    wait_next_frame()
    video.attributes = 3
    slot = ram[loop_slot]
    value3 = byte(3 - slot)
    if ((3 - slot) & 0x80) != 0:
        value3 = byte((value3 ^ 0xff) + 1)
    ram[scratch] = value3
    scratch_value = ram[scratch]
    carry_bit = ((3 - scratch_value) & 0xff) >> 7
    a_value = (((3 - scratch_value) & 0xff) << 1) & 0xff
    carry_bit2 = ((((3 - scratch_value) & 0xff) << 1) & 0xff) >> 7
    video.tile = byte((byte((byte(3 - scratch_value)) << 2)) + 0xa1)
    slot = ram[0x56]
    index = ram[0x57]
    emit_horizontal_sprite_pair(a=byte((byte((byte(3 - scratch_value)) << 2)) + 0xa1), slot=slot, index=index)
    return

def run_flag_0318_wait_transition():
    wait_vblank_and_disable_rendering()
    video.background_bank = 0x1c
    ram[scroll_y_and_ppu_control_shadow] = 0
    scroll_y_and_ppu_control_shadow[1] = 0
    clear_ram_0400_07ff()
    ram[0x56] = 0x3c
    ram[0x57] = 0x46
    generic_map_vram_source_pointers[3] = 0xd3
    generic_map_vram_source_pointers[2] = 0x43
    process_consecutive_ff_source_entries()
    ram[0x56] = 0x3c
    ram[0x57] = 0x78
    generic_map_vram_source_pointers[3] = 0xd3
    generic_map_vram_source_pointers[2] = 0x48
    process_consecutive_ff_source_entries()
    repeat_d771_over_0400_to_07ff()
    wait_vblank_and_set_ppu_control()
    world.slow_frame = 0
    audio_commands_and_event_flags[24] = 1
    audio_commands_and_event_flags[25] = 1
    audio_commands_and_event_flags[26] = 1
    while True:
        wait_next_frame()
        pressed = ram[pad_pressed]
        if not (pressed & 0x0c):
            value10 = audio_commands_and_event_flags[24]
            if value10 == 0:
                break
        else:
            break
    wait_vblank_and_disable_rendering()
    clear_ram_0400_07ff()
    repeat_d771_over_0400_to_07ff()
    wait_vblank_and_set_ppu_control()
    audio_reset()
    return

def demo_pad_bits_toward_tank(slot, candidate):
    x_pos = tanks[candidate].x
    ram[target_x_target_y] = x_pos
    y_pos = tanks[candidate].y
    target_x_target_y[1] = y_pos
    result, _ = map_target_tank_delta_to_direction_value(slot=slot)
    direction = result & 3
    bits = demo_pad_bits_by_direction[direction]
    return bits

def demo_pad_bits_toward_pickup(slot):
    x_pos = pickup.x
    ram[target_x_target_y] = x_pos
    y_pos = pickup.y
    target_x_target_y[1] = y_pos
    result, _ = map_target_tank_delta_to_direction_value(slot=slot)
    direction = result & 3
    bits = demo_pad_bits_by_direction[direction]
    return bits

def demo_pad_bits_toward_priority_enemy(slot):
    state = tanks[slot + 2].state
    if is_active_tank(state):
        bits = demo_pad_bits_toward_tank(slot, slot + 2)
        return bits
    state2 = tanks[slot + 4].state
    if is_active_tank(state2):
        bits2 = demo_pad_bits_toward_tank(slot, slot + 4)
        return bits2
    state3 = tanks[slot + 3].state
    if is_active_tank(state3):
        bits3 = demo_pad_bits_toward_tank(slot, slot + 3)
        return bits3
    no_input = 0
    return no_input

def refresh_controller_slots_from_target_probe():
    for slot in player_slots_reverse():
        pad_bits: int = 0
        pickup_x = pickup.x
        if pickup_x != 0:
            pickup_wait = pickup.cooldown
            if pickup_wait == 0:
                pad_bits = demo_pad_bits_toward_pickup(slot)
            else:
                pad_bits = demo_pad_bits_toward_priority_enemy(slot)
        else:
            pad_bits = demo_pad_bits_toward_priority_enemy(slot)
        slot6 = ram[loop_slot]
        input_state[slot6].held = pad_bits
        input_state[slot6].pressed = pad_bits
        y_pos4 = tanks[slot6].y
        if y_pos4 >= 0xc8:
            pressed = input_state[slot6].pressed
            input_state[slot6].pressed = high_nibble(pressed)
    return

def render_title_tank_tile():
    value = ram[title_cursor_or_tank_direction]
    x_pos = ram[tank_x]
    y_pos = ram[tank_y]
    render_four_table_selected_parts(value=low_nibble(value), pixel_x=x_pos, pixel_y=y_pos)
    return

def move_title_tank_one_cell(direction):
    step_x = title_tank_step_x_table[direction]
    step_x16 = shift_byte_left_4(step_x)
    x_pos = ram[tank_x]
    ram[tank_x] = byte(step_x16 + x_pos)
    step_y = title_tank_step_y_table[direction]
    step_y16 = shift_byte_left_4(step_y)
    y_pos = ram[tank_y]
    ram[tank_y] = byte(step_y16 + y_pos)

def move_title_tank_with_repeated_direction_input():
    held = ram[pad_current]
    if not (high_nibble(held)):
        stage_results_counts_and_totals[8] = 0
    else:
        repeat_frames = byte(stage_results_counts_and_totals[8] + 1)
        stage_results_counts_and_totals[8] = repeat_frames
        ram[title_repeat_and_enemy_spawn_delay] = 0
    held_frames = stage_results_counts_and_totals[8]
    if held_frames == 0x14:
        stage_results_counts_and_totals[8] = 0x0f
        held2 = ram[pad_current]
        direction = input_to_direction(held=held2)
        move_title_tank_one_cell(direction)
    else:
        pressed = ram[pad_pressed]
        if high_nibble(pressed):
            pressed2 = ram[pad_pressed]
            direction = input_to_direction(held=pressed2)
            if direction != NO_DIRECTION:
                move_title_tank_one_cell(direction)
    return

def clear_results_counts():
    next_stage_results_counts_and_totals = 0
    slot = 7
    while True:
        stage_results_counts_and_totals[slot] = next_stage_results_counts_and_totals
        slot = byte(slot - 1)
        if slot & 0x80:
            break
    return next_stage_results_counts_and_totals

def return_round_continuation_status():
    base_state = round_state.base_state
    if base_state != 0:
        enemies_left = ram[0x80]
        if enemies_left == 0:
            return 1
        life_count = ram[lives]
        player2_lives = ram[0x52]
        if byte(life_count + player2_lives) != 0:
            return 0
    transition.x = 0x70
    transition.y = 0xf0
    transition.direction = 0
    transition.lifetime = 0x11
    world.frame = 0
    return 1

def wait_for_title_start_select_or_timeout():
    ram[scroll_y_and_ppu_control_shadow] = 0
    scroll_y_and_ppu_control_shadow[1] = 0
    while True:
        wait_next_frame()
        next_scroll_y_and_ppu_control_shadow = byte(ram[scroll_y_and_ppu_control_shadow] + 1)
        ram[scroll_y_and_ppu_control_shadow] = next_scroll_y_and_ppu_control_shadow
        pressed = ram[pad_pressed]
        if pressed & 0x0c:
            saved = pull()
            saved2 = pull()
            while True:
                choose_game_mode()
                configure_demo_mode_setup()
                main_game_loop()
                reset_display_and_draw_common_screen()
                wait_for_title_start_select_or_timeout()
                continue
        value3 = ram[scroll_y_and_ppu_control_shadow]
        if value3 == 0xf0:
            return value3

def render_lives_counter_rows():
    ram[loop_slot] = 1
    ram[0x6b] = 1
    video.text_offset = 0x6e
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x41
    queue_ff_terminated_vram_string(tile_x=0x1d, tile_y=0x12)
    mode = world.mode
    if mode == 2 or world.two_players != 0:
        generic_map_vram_source_pointers[1] = 0xd3
        ram[generic_map_vram_source_pointers] = 0x41
        queue_ff_terminated_vram_string(tile_x=0x1d, tile_y=0x15)
    else:
        ram[loop_slot] = 0
    while True:
        slot = ram[loop_slot]
        lives_value = lives[slot]
        spare_lives = byte(lives_value - 1)
        if ((lives_value - 1) & 0x80) != 0:
            spare_lives = 0
        store_value_as_tens_and_ones(value=spare_lives)
        scan_zero_page_to_zero_or_ff(slot=0x19, index=0x36)
        slot9 = ram[loop_slot]
        ram[scratch] = slot9
        scaled_slot9_0 = shift_byte_left_1(slot9)
        scratch_value = ram[scratch]
        queue_offset_ff_terminated_vram_string(a=byte((byte((scaled_slot9_0) + scratch_value)) + 18), tile_y=byte((byte((scaled_slot9_0) + scratch_value)) + 18))
        next_loop_slot = byte(ram[loop_slot] - 1)
        ram[loop_slot] = next_loop_slot
        if next_loop_slot & 0x80:
            break
    video.text_offset = 0
    ram[0x6b] = 0
    return 0

def draw_player_status_text():
    generic_map_vram_source_pointers[1] = 0xd2
    ram[generic_map_vram_source_pointers] = 0xab
    queue_ff_terminated_vram_string(tile_x=0x1d, tile_y=0x11)
    mode = world.mode
    if mode == 2 or world.two_players != 0:
        generic_map_vram_source_pointers[1] = 0xd2
        ram[generic_map_vram_source_pointers] = 0xae
        queue_ff_terminated_vram_string(tile_x=0x1d, tile_y=0x14)
    return

def draw_stage_value_at_fixed_position():
    wait_next_frame()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x65
    queue_ff_terminated_vram_string(tile_x=0x1d, tile_y=0x17)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x68
    queue_ff_terminated_vram_string(tile_x=0x1d, tile_y=0x18)
    video.text_offset = 0x6e
    stage_number = world.stage
    store_value_as_tens_and_ones(value=stage_number)
    scan_zero_page_to_zero_or_ff(slot=0x19, index=0x36)
    queue_offset_ff_terminated_vram_string(tile_y=0x19)
    video.text_offset = 0
    return 0

def map_packed_index_to_text_coordinates(value):
    push(value)
    a_value = value & 1
    a_value2 = (value & 1) + 29
    saved = pull()
    scaled_saved_0 = shift_byte_right_1(saved)
    return (scaled_saved_0) + 3

def draw_d362_text_at_packed_index(packed_index):
    map_packed_index_to_text_coordinates(value=packed_index)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x62
    queue_ff_terminated_vram_string()
    return

def draw_d36b_text_at_packed_index(packed_index):
    map_packed_index_to_text_coordinates(value=packed_index)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x6b
    queue_ff_terminated_vram_string()
    return

def draw_even_d362_text_indices():
    for slot in byte_slots(loop_slot, 19):
        draw_d362_text_at_packed_index(packed_index=slot)
        next_loop_slot = byte(ram[loop_slot] - 1)
        ram[loop_slot] = next_loop_slot
    return

def clamp_tank_position_to_playfield():
    x_pos = ram[tank_x]
    if x_pos >= 0xd8:
        ram[tank_x] = 0xd8
    x_pos2 = ram[tank_x]
    if x_pos2 < 24:
        ram[tank_x] = 0x18
    y_pos = ram[tank_y]
    if y_pos >= 0xd8:
        ram[tank_y] = 0xd8
    y_pos2 = ram[tank_y]
    if y_pos2 < 24:
        ram[tank_y] = 0x18
    return

def draw_unpaused_frame_phase_sprites():
    pause_flag = world.paused
    if pause_flag != 0:
        frame = world.frame
        if frame & 0x10:
            video.attributes = 3
            video.attribute_mask = 0
            video.tile = 0x17
            emit_sprite(a=0x17, pixel_x=0x64, pixel_y=0x80)
            video.tile = 0x19
            emit_sprite(a=0x19, pixel_x=0x6c, pixel_y=0x80)
            video.tile = 0x1b
            emit_sprite(a=0x1b, pixel_x=0x74, pixel_y=0x80)
            video.tile = 0x1d
            emit_sprite(a=0x1d, pixel_x=0x7c, pixel_y=0x80)
            video.tile = 0x1f
            emit_sprite(a=0x1f, pixel_x=0x84, pixel_y=0x80)
            video.attribute_mask = 0x20
    return

def draw_transition_sprite_pair():
    video.attributes = 3
    video.attribute_mask = 0
    slot = transition.x
    flags = transition.y
    video.tile = 0x79
    emit_horizontal_sprite_pair(a=0x79, slot=slot, index=flags)
    value4 = transition.x
    flags2 = transition.y
    video.tile = 0x7d
    emit_horizontal_sprite_pair(a=0x7d, slot=byte(value4 + 16), index=flags2)
    video.attribute_mask = 0x20
    return 0x20

def step_and_draw_transition_sprite():
    flags = transition.lifetime
    if flags != 0:
        mode = world.mode
        if mode != 2:
            frame = world.frame
            if not (low_nibble(frame)):
                next_flags = byte(transition.lifetime - 1)
                transition.lifetime = next_flags
                if next_flags == 0:
                    transition.y = 0xf0
            flags2 = transition.lifetime
            if flags2 >= 10:
                flags3 = transition.direction
                value4 = ram[0xd3d5 + flags3]
                mem_105 = transition.x
                transition.x = byte(value4 + mem_105)
                value6 = ram[0xd3d9 + flags3]
                flags = transition.y
                transition.y = byte(value6 + flags)
            draw_transition_sprite_pair()
    return

def initialize_map_render_workspace():
    ram[0x56] = 2
    ram[0x57] = 2
    ram[loop_slot] = 0x1a
    ram[loop_inner] = 0x1a
    initialize_ram_and_clear_generated_blocks()
    return

def choose_game_mode():
    stage_flow.fade = 3
    clear_tank_states_and_flags()
    ram[tank_x] = 0x48
    set_menu_tank_y_from_player_count()
    ram[tank_state] = 0x83
    world.slow_frame = 0
    ram[tank_attributes] = 0
    ram[tank_sprite_phase_or_flip] = 0
    ram[control_cooldown] = 0
    control_cooldown[1] = 0
    ram[scroll_y_and_ppu_control_shadow] = 0
    stage_flow.menu_selection = 0
    scroll_y_and_ppu_control_shadow[1] = 2
    while True:
        wait_next_frame()
        frame = world.frame
        if not (frame & 3):
            value7 = ram[tank_sprite_phase_or_flip]
            ram[tank_sprite_phase_or_flip] = value7 ^ 4
        dispatch_all_eight_tank_render_handlers()
        pressed = ram[pad_pressed]
        if pressed & 4:
            value = byte(world.two_players + 1)
            world.two_players = value
            world.slow_frame = 0
        held = ram[pad_current]
        if held & 0x20:
            pressed2 = input_state[1].pressed
            if pressed2 & 1:
                mem_4a = stage_flow.menu_selection
                stage_flow.menu_selection = byte(16 + mem_4a)
        held2 = ram[pad_current]
        if held2 & 0x80:
            pressed3 = input_state[1].pressed
            if pressed3 & 2:
                value = byte(stage_flow.menu_selection - 1)
                stage_flow.menu_selection = value
        two_player_game = world.two_players
        if two_player_game >= 3:
            world.two_players = 0
        set_menu_tank_y_from_player_count()
        frame_hi = world.slow_frame
        if frame_hi == 0x0a:
            value19 = stage_flow.title_phase
            if value19 == 0:
                return value19
        pressed4 = ram[pad_pressed]
        if not (pressed4 & 8):
            continue
        value21 = stage_flow.title_phase
        if value21 == 7:
            value22 = stage_flow.menu_selection
            if value22 == 0x74:
                run_timed_text_draw_sequence()
        stage_flow.fade = 0
        saved = pull()
        saved2 = pull()
        value24 = world.two_players
        scaled_value24_0 = shift_byte_left_1(value24)
        direction = scaled_value24_0
        next_generic_map_vram_source_pointers = ram[0xca69 + direction]
        ram[generic_map_vram_source_pointers] = next_generic_map_vram_source_pointers
        value27 = ram[0xca6a + direction]
        generic_map_vram_source_pointers[1] = value27
        jump(indirect_word(0x0011))

def set_spawn_parameter_5_and_enter_stage_sequence():
    spawn_slot = 5
    ram[enemy_spawn_start_slot] = 5
    initialize_score_slots_then_fall_through()
    return run_stage_campaign()

def set_spawn_parameter_7_and_enter_stage_sequence():
    ram[enemy_spawn_start_slot] = 7
    initialize_score_slots_then_fall_through()
    return run_stage_campaign()

def set_spawn_parameter_7_and_enter_pregame_setup():
    ram[enemy_spawn_start_slot] = 7
    value = stage_flow.title_phase
    if value == 0:
        wait_vblank_and_disable_rendering()
        initialize_map_render_workspace()
        repeat_d771_over_0400_to_07ff()
        wait_vblank_and_set_ppu_control()
    clear_tank_states_and_flags()
    ram[tank_x] = 0x10
    ram[tank_y] = 0x18
    ram[tank_state] = 0x84
    ram[tank_attributes] = 0
    video.attribute_mask = 0
    ram[tank_sprite_phase_or_flip] = 0
    ram[title_repeat_and_enemy_spawn_delay] = 0
    stage_results_counts_and_totals[8] = 0
    ram[title_cursor_or_tank_direction] = 0
    ram[scroll_y_and_ppu_control_shadow] = 0
    scroll_y_and_ppu_control_shadow[1] = 0
    ram[control_cooldown] = 0
    control_cooldown[1] = 0
    value6 = stage_flow.title_phase
    if value6 == 0:
        queue_status_vram_update()
    while True:
        wait_next_frame()
        move_title_tank_with_repeated_direction_input()
        clamp_tank_position_to_playfield()
        frame = world.frame
        if frame & 0x10:
            dispatch_all_eight_tank_render_handlers()
        held = ram[pad_current]
        if not high_nibble(held):
            pressed = ram[pad_pressed]
            if pressed & 1:
                value10 = ram[title_repeat_and_enemy_spawn_delay]
                if value10 != 0:
                    value = byte(ram[title_cursor_or_tank_direction] + 1)
                    ram[title_cursor_or_tank_direction] = value
                    value11 = ram[title_cursor_or_tank_direction]
                    if value11 == 0x0e:
                        ram[title_cursor_or_tank_direction] = 0
                else:
                    value = byte(ram[title_repeat_and_enemy_spawn_delay] + 1)
                    ram[title_repeat_and_enemy_spawn_delay] = value
                render_title_tank_tile()
            else:
                pressed2 = ram[pad_pressed]
                if pressed2 & 2:
                    value14 = ram[title_repeat_and_enemy_spawn_delay]
                    if value14 != 0:
                        value = byte(ram[title_cursor_or_tank_direction] - 1)
                        ram[title_cursor_or_tank_direction] = value
                        value15 = ram[title_cursor_or_tank_direction]
                        if value15 == 0xff:
                            ram[title_cursor_or_tank_direction] = 0x0d
                    else:
                        value = byte(ram[title_repeat_and_enemy_spawn_delay] + 1)
                        ram[title_repeat_and_enemy_spawn_delay] = value
                    render_title_tank_tile()
                else:
                    held2 = ram[pad_current]
                    if held2 & 3:
                        render_title_tank_tile()
        else:
            held2 = ram[pad_current]
            if held2 & 3:
                render_title_tank_tile()
        pressed3 = ram[pad_pressed]
        if pressed3 & 8:
            break
        continue
    video.attribute_mask = 0x20
    value = byte(stage_flow.title_phase + 1)
    stage_flow.title_phase = value
    while True:
        choose_game_mode()
        configure_demo_mode_setup()
        main_game_loop()
        reset_display_and_draw_common_screen()
        wait_for_title_start_select_or_timeout()
        continue

def set_menu_tank_y_from_player_count():
    two_player_game = world.two_players
    scaled_two_player_game_0 = shift_byte_left_4(two_player_game)
    ram[tank_y] = byte((scaled_two_player_game_0) + 0x8b)
    return byte((scaled_two_player_game_0) + 0x8b)

def queue_stage_value_vram_update():
    wait_next_frame()
    encode_tile_coordinates_to_ppu_address(tile_x=0x0c, tile_y=0x0e)
    result2 = a
    next_vram_command_buffer = y
    vram_cursor_value = ram[vram_cursor]
    vram_command_buffer[vram_cursor_value] = byte(result2 + 28)
    slot3 = byte(vram_cursor_value + 1)
    vram_command_buffer[slot3] = next_vram_command_buffer
    slot4 = byte(slot3 + 1)
    vram_command_buffer[slot4] = 0x23
    slot5 = byte(slot4 + 1)
    vram_command_buffer[slot5] = 0x24
    slot6 = byte(slot5 + 1)
    vram_command_buffer[slot6] = 0x25
    slot7 = byte(slot6 + 1)
    vram_command_buffer[slot7] = 0x26
    slot8 = byte(slot7 + 1)
    vram_command_buffer[slot8] = 0x27
    slot9 = byte(slot8 + 1)
    vram_command_buffer[slot9] = 0x11
    slot10 = byte(slot9 + 1)
    vram_command_buffer[slot10] = 0x11
    slot11 = byte(slot10 + 1)
    vram_command_buffer[slot11] = 0xff
    ram[vram_cursor] = byte(slot11 + 1)
    video.text_offset = 0x6e
    stage_number = world.stage
    store_value_as_tens_and_ones(value=stage_number)
    scan_zero_page_to_zero_or_ff(slot=0x0e, index=0x36)
    queue_offset_ff_terminated_vram_string(tile_y=0x0e)
    video.text_offset = 0
    return 0

def queue_status_vram_update():
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x6d
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=0x18)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x74
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=0x19)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x7b
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=0x1a)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x82
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=0x1b)
    vram_cursor_value = ram[vram_cursor]
    vram_command_buffer[vram_cursor_value] = 0x23
    slot10 = byte(vram_cursor_value + 1)
    vram_command_buffer[slot10] = 0xf3
    map_collision_workspace[1011] = 0
    slot11 = byte(slot10 + 1)
    vram_command_buffer[slot11] = 0
    value12 = map_collision_workspace[1012]
    map_collision_workspace[1012] = value12 & 0xcc
    slot12 = byte(slot11 + 1)
    vram_command_buffer[slot12] = value12 & 0xcc
    slot13 = byte(slot12 + 1)
    vram_command_buffer[slot13] = 0xff
    ram[vram_cursor] = byte(slot13 + 1)
    return 0xff

def queue_masked_status_vram_update():
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xa5
    queue_ff_terminated_vram_string(tile_x=0x0e, tile_y=0x1a)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xa8
    queue_ff_terminated_vram_string(tile_x=0x0e, tile_y=0x1b)
    vram_cursor_value = ram[vram_cursor]
    vram_command_buffer[vram_cursor_value] = 0x23
    slot6 = byte(vram_cursor_value + 1)
    vram_command_buffer[slot6] = 0xf3
    value7 = map_collision_workspace[1011]
    map_collision_workspace[1011] = value7 & 0x3f
    slot7 = byte(slot6 + 1)
    vram_command_buffer[slot7] = value7 & 0x3f
    slot8 = byte(slot7 + 1)
    vram_command_buffer[slot8] = 0xff
    ram[vram_cursor] = byte(slot8 + 1)
    return 0xff

def queue_status_vram_variant():
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x89
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=0x18)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x90
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=0x19)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x97
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=0x1a)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x9e
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=0x1b)
    vram_cursor_value = ram[vram_cursor]
    vram_command_buffer[vram_cursor_value] = 0x23
    slot10 = byte(vram_cursor_value + 1)
    vram_command_buffer[slot10] = 0xf3
    map_collision_workspace[1011] = 0x3f
    slot11 = byte(slot10 + 1)
    vram_command_buffer[slot11] = 0x3f
    value12 = map_collision_workspace[1012]
    map_collision_workspace[1012] = (value12 & 0xcc) | 0x33
    slot12 = byte(slot11 + 1)
    vram_command_buffer[slot12] = (value12 & 0xcc) | 0x33
    slot13 = byte(slot12 + 1)
    vram_command_buffer[slot13] = 0xff
    ram[vram_cursor] = byte(slot13 + 1)
    return 0xff

def draw_two_fixed_text_rows():
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xab
    queue_ff_terminated_vram_string(tile_x=0x0e, tile_y=0x1a)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xae
    queue_ff_terminated_vram_string(tile_x=0x0e, tile_y=0x1b)
    return

def queue_playfield_tail_block_to_vram():
    generic_map_vram_source_pointers[1] = 0x23
    ram[generic_map_vram_source_pointers] = 0xc0
    index = 0
    while True:
        wait_next_frame()
        vram_cursor_value = ram[vram_cursor]
        next_vram_command_buffer = generic_map_vram_source_pointers[1]
        vram_command_buffer[vram_cursor_value] = next_vram_command_buffer
        value4 = ram[generic_map_vram_source_pointers]
        slot2 = byte(vram_cursor_value + 1)
        vram_command_buffer[slot2] = value4
        value5 = ram[map_collision_workspace + 960 + index]
        slot3 = byte(slot2 + 1)
        vram_command_buffer[slot3] = value5
        slot4 = byte(slot3 + 1)
        vram_command_buffer[slot4] = 0xff
        ram[vram_cursor] = byte(slot4 + 1)
        add_a_to_word_11_12(value=1, y=byte(index + 1))
        difference = ((index + 1) & 0xff) - 64
        index = byte(index + 1)
        if index == 0x40:
            break
    return

def queue_32_byte_vram_write(tile_y):
    next_generic_map_vram_source_pointers, index = encode_tile_coordinates_to_ppu_address(tile_x=0, tile_y=tile_y)
    generic_map_vram_source_pointers[1] = next_generic_map_vram_source_pointers
    ram[generic_map_vram_source_pointers] = index
    vram_cursor_value = ram[vram_cursor]
    value = generic_map_vram_source_pointers[1]
    vram_command_buffer[vram_cursor_value] = byte(value + 28)
    next_vram_command_buffer = ram[generic_map_vram_source_pointers]
    slot3 = byte(vram_cursor_value + 1)
    vram_command_buffer[slot3] = next_vram_command_buffer
    slot4 = byte(slot3 + 1)
    index2 = 0
    while True:
        value4 = ram[vram_row_fill_mode]
        if value4 == 0:
            value2 = ram[read_word(generic_map_vram_source_pointers) + index2]
            value4 = value2
        vram_command_buffer[slot4] = value4
        difference = ((index2 + 1) & 0xff) - 32
        slot4 = byte(slot4 + 1)
        index2 = byte(index2 + 1)
        if index2 == 0x20:
            break
    vram_command_buffer[slot4] = 0xff
    ram[vram_cursor] = byte(slot4 + 1)
    return 0xff

def animate_constant_vram_rows_incrementing():
    ram[vram_row_fill_mode] = 0x11
    ram[0x57] = 0
    while True:
        wait_next_frame()
        index = ram[0x57]
        queue_32_byte_vram_write(tile_y=index)
        mem_57 = ram[0x57]
        queue_32_byte_vram_write(a=byte(29 - mem_57), tile_y=byte(29 - mem_57))
        next_ram = byte(ram[0x57] + 1)
        ram[0x57] = next_ram
        value5 = ram[0x57]
        if value5 == 0x10:
            break
    return value5

def animate_pointer_vram_rows_decrementing():
    ram[vram_row_fill_mode] = 0
    ram[0x57] = 0x0f
    while True:
        wait_next_frame()
        index = ram[0x57]
        queue_32_byte_vram_write(tile_y=index)
        mem_57 = ram[0x57]
        queue_32_byte_vram_write(a=byte(29 - mem_57), tile_y=byte(29 - mem_57))
        next_ram = byte(ram[0x57] - 1)
        ram[0x57] = next_ram
        value5 = ram[0x57]
        if value5 == 0xff:
            break
    return value5

def run_four_slot_counter_display_loop():
    initialize_and_draw_status_screen()
    repeat_attribute_update_for_frames(slot=0x1e)
    value = ram[stage_results_counts_and_totals]
    mem_74 = stage_results_counts_and_totals[1]
    mem_75 = stage_results_counts_and_totals[2]
    mem_76 = stage_results_counts_and_totals[3]
    stage_results_counts_and_totals[10] = byte((byte((byte(value + mem_74)) + mem_75)) + mem_76)
    value5 = stage_results_counts_and_totals[4]
    mem_78 = stage_results_counts_and_totals[5]
    mem_79 = stage_results_counts_and_totals[6]
    mem_7a = stage_results_counts_and_totals[7]
    stage_results_counts_and_totals[11] = byte((byte((byte(value5 + mem_78)) + mem_79)) + mem_7a)
    ram[loop_slot] = 0
    while True:
        wait_next_frame()
        apply_four_attribute_value_blocks()
        clear_seven_bytes_set_ff_sentinel(base=0x25)
        clear_seven_bytes_set_ff_sentinel(base=0x2d)
        ram[0x5d] = 0
        ram[0x5e] = 0
        while True:
            wait_next_frame()
            apply_four_attribute_value_blocks()
            stage_results_counts_and_totals[9] = 0
            slot8 = ram[loop_slot]
            value12 = ram[0xd3d1 + slot8]
            initialize_score_increment_record(value=value12)
            slot10 = ram[loop_slot]
            value13 = stage_results_counts_and_totals[slot10]
            if value13 != 0:
                audio_commands_and_event_flags[19] = 1
                audio_commands_and_event_flags[20] = 1
                value = byte(stage_results_counts_and_totals[slot10] - 1)
                stage_results_counts_and_totals[slot10] = value
                value2 = byte(ram[0x5d] + 1)
                ram[0x5d] = value2
                add_seven_decimal_digits(slot=2)
                stage_results_counts_and_totals[9] = 1
                update_bonus_life_counters()
            slot13 = ram[loop_slot]
            value16 = stage_results_counts_and_totals[slot13 + 4]
            if value16 != 0:
                audio_commands_and_event_flags[19] = 1
                audio_commands_and_event_flags[20] = 1
                value = byte(stage_results_counts_and_totals[slot13 + 4] - 1)
                stage_results_counts_and_totals[slot13 + 4] = value
                value2 = byte(ram[0x5e] + 1)
                ram[0x5e] = value2
                add_seven_decimal_digits(slot=3)
                stage_results_counts_and_totals[9] = 1
                update_bonus_life_counters()
            scan_zero_page_to_zero_or_ff(slot=5, index=0x16)
            queue_offset_ff_terminated_vram_string(tile_y=9)
            scan_zero_page_to_zero_or_ff(slot=1, index=0x26)
            slot21 = ram[loop_slot]
            scaled_slot21_0 = shift_byte_left_1(slot21)
            slot = ram[loop_slot]
            queue_offset_ff_terminated_vram_string(a=byte((byte((scaled_slot21_0) + slot)) + 12), tile_y=byte((byte((scaled_slot21_0) + slot)) + 12))
            slot23 = ram[loop_slot]
            value22 = ram[0x5d]
            store_value_as_tens_and_ones(value=value22)
            scan_zero_page_to_zero_or_ff(slot=8, index=0x36)
            slot27 = ram[loop_slot]
            scaled_slot27_1 = shift_byte_left_1(slot27)
            slot = ram[loop_slot]
            queue_offset_ff_terminated_vram_string(a=byte((byte((scaled_slot27_1) + slot)) + 12), tile_y=byte((byte((scaled_slot27_1) + slot)) + 12))
            two_player_game = world.two_players
            if two_player_game != 0:
                scan_zero_page_to_zero_or_ff(slot=0x17, index=0x1e)
                queue_offset_ff_terminated_vram_string(tile_y=9)
                scan_zero_page_to_zero_or_ff(slot=0x13, index=0x2e)
                slot34 = ram[loop_slot]
                scaled_slot34_2 = shift_byte_left_1(slot34)
                slot = ram[loop_slot]
                queue_offset_ff_terminated_vram_string(a=byte((byte((scaled_slot34_2) + slot)) + 12), tile_y=byte((byte((scaled_slot34_2) + slot)) + 12))
                slot36 = ram[loop_slot]
                value30 = ram[0x5e]
                store_value_as_tens_and_ones(value=value30)
                scan_zero_page_to_zero_or_ff(slot=0x0e, index=0x36)
                slot40 = ram[loop_slot]
                scaled_slot40_3 = shift_byte_left_1(slot40)
                slot = ram[loop_slot]
                queue_offset_ff_terminated_vram_string(a=byte((byte((scaled_slot40_3) + slot)) + 12), tile_y=byte((byte((scaled_slot40_3) + slot)) + 12))
            repeat_attribute_update_for_frames(slot=8)
            value34 = stage_results_counts_and_totals[9]
            if value34 != 0:
                continue
            break
        value = byte(ram[loop_slot] + 1)
        ram[loop_slot] = value
        slot44 = ram[loop_slot]
        if slot44 != 4:
            repeat_attribute_update_for_frames(slot=0x14)
            continue
        break
    repeat_attribute_update_for_frames(slot=0x1e)
    value35 = stage_results_counts_and_totals[10]
    store_value_as_tens_and_ones(value=value35)
    scan_zero_page_to_zero_or_ff(slot=8, index=0x36)
    queue_offset_ff_terminated_vram_string(tile_y=0x17)
    value36 = world.two_players
    if value36 != 0:
        value37 = stage_results_counts_and_totals[11]
        store_value_as_tens_and_ones(value=value37)
        scan_zero_page_to_zero_or_ff(slot=0x0e, index=0x36)
        queue_offset_ff_terminated_vram_string(tile_y=0x17)
    repeat_attribute_update_for_frames(slot=0x0f)
    value38 = world.two_players
    if value38 != 0:
        value39 = round_state.base_state
        if value39 != 0:
            player2_total = stage_results_counts_and_totals[11]
            player1_total = stage_results_counts_and_totals[10]
            if player2_total >= player1_total or ram[lives] == 0:
                player1_total2 = stage_results_counts_and_totals[10]
                player2_total2 = stage_results_counts_and_totals[11]
                if player1_total2 < player2_total2:
                    player2_lives = ram[0x52]
                    if player2_lives != 0:
                        initialize_score_increment_record(value=0)
                        add_seven_decimal_digits(slot=1)
                        scan_zero_page_to_zero_or_ff(slot=0x17, index=0x1e)
                        queue_offset_ff_terminated_vram_string(tile_y=9)
                        scan_zero_page_to_zero_or_ff(slot=0x14, index=0x36)
                        queue_offset_ff_terminated_vram_string(tile_y=0x1a)
                        generic_map_vram_source_pointers[1] = 0xd3
                        ram[generic_map_vram_source_pointers] = 0xc4
                        queue_ff_terminated_vram_string(tile_x=0x16, tile_y=0x19)
                        generic_map_vram_source_pointers[1] = 0xd3
                        ram[generic_map_vram_source_pointers] = 0x5e
                        queue_ff_terminated_vram_string(tile_x=0x1b, tile_y=0x1a)
                        audio_commands_and_event_flags[27] = 1
                        audio_commands_and_event_flags[28] = 1
                        audio_commands_and_event_flags[29] = 1
                        update_bonus_life_counters()
            else:
                initialize_score_increment_record(value=0)
                add_seven_decimal_digits(slot=0)
                scan_zero_page_to_zero_or_ff(slot=5, index=0x16)
                queue_offset_ff_terminated_vram_string(tile_y=9)
                scan_zero_page_to_zero_or_ff(slot=1, index=0x36)
                queue_offset_ff_terminated_vram_string(tile_y=0x1a)
                generic_map_vram_source_pointers[1] = 0xd3
                ram[generic_map_vram_source_pointers] = 0xc4
                queue_ff_terminated_vram_string(tile_x=3, tile_y=0x19)
                generic_map_vram_source_pointers[1] = 0xd3
                ram[generic_map_vram_source_pointers] = 0x5e
                queue_ff_terminated_vram_string(tile_x=8, tile_y=0x1a)
                audio_commands_and_event_flags[27] = 1
                audio_commands_and_event_flags[28] = 1
                audio_commands_and_event_flags[29] = 1
                update_bonus_life_counters()
        else:
    else:
    repeat_attribute_update_for_frames(slot=0x78)
    scroll_y_and_ppu_control_shadow[1] = 0
    video.text_offset = 0
    ram[0x6b] = 0
    stage_flow.fade = 0
    return 0

def initialize_and_draw_status_screen():
    wait_next_frame()
    ram[0x6b] = 1
    video.background_bank = 0x24
    ram[scroll_y_and_ppu_control_shadow] = 0
    scroll_y_and_ppu_control_shadow[1] = 2
    video.text_offset = 0x30
    stage_flow.fade = 3
    wait_vblank_and_disable_rendering()
    clear_ram_0400_07ff()
    initialize_attribute_data_tables()
    repeat_d771_over_0400_to_07ff()
    wait_vblank_and_set_ppu_control()
    generic_map_vram_source_pointers[1] = 0xd2
    ram[generic_map_vram_source_pointers] = 0xbd
    queue_ff_terminated_vram_string(tile_x=8, tile_y=3)
    scan_zero_page_to_zero_or_ff(slot=0x12, index=0x3e)
    queue_offset_ff_terminated_vram_string(tile_y=3)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xcb
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=5)
    stage_number = world.stage
    store_value_as_tens_and_ones(value=stage_number)
    scan_zero_page_to_zero_or_ff(slot=0x0e, index=0x36)
    queue_offset_ff_terminated_vram_string(tile_y=5)
    wait_next_frame()
    generic_map_vram_source_pointers[1] = 0xd2
    ram[generic_map_vram_source_pointers] = 0xd9
    queue_ff_terminated_vram_string(tile_x=3, tile_y=7)
    scan_zero_page_to_zero_or_ff(slot=5, index=0x16)
    queue_offset_ff_terminated_vram_string(tile_y=9)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xb1
    queue_ff_terminated_vram_string(tile_x=0x0e, tile_y=0x0c)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xb1
    queue_ff_terminated_vram_string(tile_x=0x0e, tile_y=0x0f)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xb1
    queue_ff_terminated_vram_string(tile_x=0x0e, tile_y=0x12)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xb1
    queue_ff_terminated_vram_string(tile_x=0x0e, tile_y=0x15)
    two_player_game = world.two_players
    if two_player_game != 0:
        wait_next_frame()
        generic_map_vram_source_pointers[1] = 0xd2
        ram[generic_map_vram_source_pointers] = 0xe2
        queue_ff_terminated_vram_string(tile_x=0x15, tile_y=7)
        scan_zero_page_to_zero_or_ff(slot=0x17, index=0x1e)
        queue_offset_ff_terminated_vram_string(tile_y=9)
        generic_map_vram_source_pointers[1] = 0xd3
        ram[generic_map_vram_source_pointers] = 0xb3
        queue_ff_terminated_vram_string(tile_x=0x11, tile_y=0x0c)
        generic_map_vram_source_pointers[1] = 0xd3
        ram[generic_map_vram_source_pointers] = 0xb3
        queue_ff_terminated_vram_string(tile_x=0x11, tile_y=0x0f)
        generic_map_vram_source_pointers[1] = 0xd3
        ram[generic_map_vram_source_pointers] = 0xb3
        queue_ff_terminated_vram_string(tile_x=0x11, tile_y=0x12)
        generic_map_vram_source_pointers[1] = 0xd3
        ram[generic_map_vram_source_pointers] = 0xb3
        queue_ff_terminated_vram_string(tile_x=0x11, tile_y=0x15)
    wait_next_frame()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x5e
    queue_ff_terminated_vram_string(tile_x=8, tile_y=0x0c)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x5e
    queue_ff_terminated_vram_string(tile_x=8, tile_y=0x0f)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x5e
    queue_ff_terminated_vram_string(tile_x=8, tile_y=0x12)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0x5e
    queue_ff_terminated_vram_string(tile_x=8, tile_y=0x15)
    value40 = world.two_players
    if value40 != 0:
        wait_next_frame()
        generic_map_vram_source_pointers[1] = 0xd3
        ram[generic_map_vram_source_pointers] = 0x5e
        queue_ff_terminated_vram_string(tile_x=0x1a, tile_y=0x0c)
        generic_map_vram_source_pointers[1] = 0xd3
        ram[generic_map_vram_source_pointers] = 0x5e
        queue_ff_terminated_vram_string(tile_x=0x1a, tile_y=0x0f)
        generic_map_vram_source_pointers[1] = 0xd3
        ram[generic_map_vram_source_pointers] = 0x5e
        queue_ff_terminated_vram_string(tile_x=0x1a, tile_y=0x12)
        generic_map_vram_source_pointers[1] = 0xd3
        ram[generic_map_vram_source_pointers] = 0x5e
        queue_ff_terminated_vram_string(tile_x=0x1a, tile_y=0x15)
    wait_next_frame()
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xbb
    queue_ff_terminated_vram_string(tile_x=0x0c, tile_y=0x16)
    generic_map_vram_source_pointers[1] = 0xd3
    ram[generic_map_vram_source_pointers] = 0xb5
    queue_ff_terminated_vram_string(tile_x=6, tile_y=0x17)
    return

def apply_four_attribute_value_blocks():
    video.attributes = 2
    set_attribute_value_and_emit_sprite_pair(value=0x80, pixel_y=0x64)
    set_attribute_value_and_emit_sprite_pair(value=0xa0, pixel_y=0x7c)
    set_attribute_value_and_emit_sprite_pair(value=0xc0, pixel_y=0x94)
    set_attribute_value_and_emit_sprite_pair(value=0xe0, pixel_y=0xac)
    return

def initialize_attribute_data_tables():
    map_collision_workspace[960] = 0x50
    map_collision_workspace[961] = 0x50
    map_collision_workspace[962] = 0x50
    map_collision_workspace[963] = 0x50
    map_collision_workspace[968] = 0x50
    map_collision_workspace[969] = 0x50
    map_collision_workspace[970] = 0x50
    map_collision_workspace[973] = 0x50
    map_collision_workspace[974] = 0x50
    map_collision_workspace[975] = 0x50
    map_collision_workspace[964] = 0xa0
    map_collision_workspace[965] = 0xa0
    map_collision_workspace[966] = 0xa0
    map_collision_workspace[967] = 0xa0
    map_collision_workspace[976] = 0x0a
    map_collision_workspace[977] = 0x0a
    map_collision_workspace[978] = 0x0a
    map_collision_workspace[981] = 0x0a
    map_collision_workspace[982] = 0x0a
    map_collision_workspace[983] = 0x0a
    map_collision_workspace[1008] = 5
    map_collision_workspace[1009] = 5
    map_collision_workspace[1010] = 5
    map_collision_workspace[1013] = 5
    map_collision_workspace[1014] = 5
    map_collision_workspace[1015] = 5
    return 5

def set_attribute_value_and_emit_sprite_pair(value, pixel_y):
    video.tile = value
    emit_horizontal_sprite_pair(a=value, slot=0x81, index=pixel_y)
    return

def update_bonus_life_counters():
    base_state = round_state.base_state
    if base_state == 0x80:
        player1_awarded = ram[extra_life_award_latches]
        if player1_awarded == 0:
            player1_score_high = two_seven_digit_score_records[2]
            if player1_score_high >= 2:
                player1_lives = byte(ram[lives] + 1)
                ram[lives] = player1_lives
                player1_latch = byte(ram[extra_life_award_latches] + 1)
                ram[extra_life_award_latches] = player1_latch
                audio_commands_and_event_flags[4] = 1
                audio_commands_and_event_flags[5] = 1
                return
        two_player_game = world.two_players
        if two_player_game != 0:
            player2_awarded = extra_life_award_latches[1]
            if player2_awarded == 0:
                player2_score_high = two_seven_digit_score_records[10]
                if player2_score_high >= 2:
                    player2_lives = byte(ram[0x52] + 1)
                    ram[0x52] = player2_lives
                    player2_latch = byte(extra_life_award_latches[1] + 1)
                    extra_life_award_latches[1] = player2_latch
                    audio_commands_and_event_flags[4] = 1
                    audio_commands_and_event_flags[5] = 1
    return

def reset_display_and_draw_common_screen():
    wait_vblank_and_disable_rendering()
    stage_flow.fade = 3
    video.background_bank = 0x1c
    clear_ram_0400_07ff()
    repeat_d771_over_0400_to_07ff()
    wait_vblank_and_set_ppu_control()
    return

def draw_title():
    wait_vblank_and_disable_rendering()
    video.background_bank = 0x24
    clear_ram_0400_07ff()
    ram[0x56] = 0x1a
    ram[0x57] = 0x2e
    generic_map_vram_source_pointers[3] = 0xd2
    generic_map_vram_source_pointers[2] = 0x99
    process_consecutive_ff_source_entries()
    ram[0x56] = 0x3c
    ram[0x57] = 0x56
    generic_map_vram_source_pointers[3] = 0xd2
    generic_map_vram_source_pointers[2] = 0xa0
    process_consecutive_ff_source_entries()
    repeat_d771_over_0400_to_07ff()
    wait_vblank_and_set_ppu_control()
    video.text_offset = 0x30
    generic_map_vram_source_pointers[1] = 0xd2
    ram[generic_map_vram_source_pointers] = 0xa5
    queue_ff_terminated_vram_string(tile_x=2, tile_y=3)
    scan_zero_page_to_zero_or_ff(slot=4, index=0x16)
    queue_offset_ff_terminated_vram_string(tile_y=3)
    generic_map_vram_source_pointers[1] = 0xd2
    ram[generic_map_vram_source_pointers] = 0xb1
    queue_ff_terminated_vram_string(tile_x=0x0b, tile_y=3)
    scan_zero_page_to_zero_or_ff(slot=0x0e, index=0x3e)
    queue_offset_ff_terminated_vram_string(tile_y=3)
    two_player_game = world.two_players
    if two_player_game != 0:
        generic_map_vram_source_pointers[1] = 0xd2
        ram[generic_map_vram_source_pointers] = 0xa8
        queue_ff_terminated_vram_string(tile_x=0x15, tile_y=3)
        scan_zero_page_to_zero_or_ff(slot=0x17, index=0x1e)
        queue_offset_ff_terminated_vram_string(tile_y=3)
    video.text_offset = 0
    wait_next_frame()
    generic_map_vram_source_pointers[1] = 0xd2
    ram[generic_map_vram_source_pointers] = 0xc6
    queue_ff_terminated_vram_string(tile_x=0x0b, tile_y=0x11)
    generic_map_vram_source_pointers[1] = 0xd2
    ram[generic_map_vram_source_pointers] = 0xcf
    queue_ff_terminated_vram_string(tile_x=0x0b, tile_y=0x13)
    generic_map_vram_source_pointers[1] = 0xd2
    ram[generic_map_vram_source_pointers] = 0xeb
    queue_ff_terminated_vram_string(tile_x=0x0b, tile_y=0x15)
    wait_next_frame()
    generic_map_vram_source_pointers[1] = 0xd2
    ram[generic_map_vram_source_pointers] = 0x8f
    queue_vram_string_and_maybe_unwind(tile_x=0x0b, tile_y=0x17)
    generic_map_vram_source_pointers[1] = 0xff
    ram[generic_map_vram_source_pointers] = 0xcd
    queue_ff_terminated_vram_string(tile_x=8, tile_y=0x19)
    wait_next_frame()
    generic_map_vram_source_pointers[1] = 0xff
    ram[generic_map_vram_source_pointers] = 0xde
    queue_ff_terminated_vram_string(tile_x=0x0b, tile_y=0x1b)
    return

def repeat_attribute_update_for_frames(slot):
    while True:
        wait_next_frame()
        push(slot)
        apply_four_attribute_value_blocks()
        saved = pull()
        slot = byte(saved - 1)
        if slot == 0:
            break
    return saved

def vblank_interrupt(slot, index, value):
    push(value)
    push(slot)
    push(index)
    push_status()
    a_value = 0
    ram[0x2003] = 0
    a_value = 2
    ram[sprite_dma] = 2
    ppu_status_value = ram[ppu_status]
    flush_vram_buffer()
    value7 = stage_flow.fade
    if not (value7 & 0x80):
        load_palette_variant(value=value7)
    value8 = scroll_y_and_ppu_control_shadow[1]
    a_value = value8 | 0xb0
    ram[ppu_control] = value8 | 0xb0
    a_value = 0
    ram[ppu_scroll] = 0
    next_ppu_scroll = ram[scroll_y_and_ppu_control_shadow]
    ram[ppu_scroll] = next_ppu_scroll
    a_value = 0x1e
    ram[ppu_mask] = 0x1e
    poll_controllers()
    hide_unused_sprites()
    audio_tick()
    value = byte(world.frame + 1)
    world.frame = value
    frame = world.frame
    if not (frame & 0x3f):
        value = byte(world.slow_frame + 1)
        world.slow_frame = value
    pull_status()
    saved = pull()
    saved2 = pull()
    saved3 = pull()
    return_from_interrupt

def random_byte(slot):
    push(slot)
    random_value = ram[rng_state]
    scaled_random_value_0 = shift_byte_left_3(random_value)
    mem_0f = ram[rng_state]
    frame_hi = world.slow_frame
    next_ram = byte(ram[0x10] + 1)
    ram[0x10] = next_ram
    slot2 = ram[0x10]
    scratch_value = scratch[slot2]
    ram[rng_state] = byte((byte((byte((scaled_random_value_0) - mem_0f)) + frame_hi)) + scratch_value + int(((byte((scaled_random_value_0) - mem_0f)) + frame_hi) > 0xff))
    saved = pull()
    value9 = ram[rng_state]
    return value9, saved

def wait_vblank_and_set_ppu_control():
    wait_for_vblank_flag()
    a_value = 0xb0
    ram[ppu_control] = 0xb0
    return 0xb0

def wait_vblank_and_disable_rendering():
    wait_next_frame()
    a_value = 0x10
    ram[ppu_control] = 0x10
    a_value = 6
    ram[ppu_mask] = 6
    return 6

def clear_ram_0400_07ff():
    value = 0
    slot = value
    while True:
        map_collision_workspace[slot] = value
        ram[map_collision_workspace + 256 + slot] = value
        ram[map_collision_workspace + 512 + slot] = value
        ram[map_collision_workspace + 768 + slot] = value
        slot = byte(slot + 1)
        if slot == 0:
            break
    return value

def initialize_game():
    video.text_offset = 0
    ram[0x6b] = 0
    ram[vram_cursor] = 0
    ram[sprite_cursor] = 0
    world.paused = 0
    stage_flow.fade = 0xff
    initialize_ppu_palettes()
    ram[0x0e] = 4
    video.attribute_mask = 0x20
    clear_ram_0400_07ff()
    hide_unused_sprites()
    clear_seven_bytes_set_ff_sentinel(base=0x15)
    clear_seven_bytes_set_ff_sentinel(base=0x1d)
    config_signature_matches = compare_0110_with_c040_config()
    if config_signature_matches == 0:
        clear_seven_bytes_set_ff_sentinel(base=0x3d)
        maximum_score_digits[2] = 2
        world.two_players = 0
    video.background_bank = 0x1c
    repeat_d771_over_0400_to_07ff()
    video.background_bank = 0x24
    repeat_d771_over_0400_to_07ff()
    copy_c040_config_to_0110()
    audio_reset()
    return

def copy_c040_config_to_0110():
    slot = 0x0f
    while True:
        next_configuration_signature_ram = ram[0xc040 + slot]
        configuration_signature_ram[slot] = next_configuration_signature_ram
        slot = byte(slot - 1)
        if slot & 0x80:
            break
    return next_configuration_signature_ram

def compare_0110_with_c040_config():
    slot = 0x0f
    while True:
        value = configuration_signature_ram[slot]
        mem_c040 = ram[0xc040 + slot]
        if value != mem_c040:
            return 0
        slot = byte(slot - 1)
        if slot & 0x80:
            return 1

def initialize_ppu_palettes():
    wait_for_vblank_flag()
    load_fixed_sprite_palette()
    load_palette_variant(value=0)
    return

def load_palette_variant(value):
    scaled_value_0 = shift_byte_left_4_value(value)
    y_value = 0x10
    a_value5 = 0x3f
    ram[ppu_address] = 0x3f
    a_value = 0
    ram[ppu_address] = 0
    slot = scaled_value_0
    index = 0x10
    while True:
        next_ppu_data = select_table_byte_by_state_flags(slot=slot)
        ram[ppu_data] = next_ppu_data
        slot = byte(slot + 1)
        index = byte(index - 1)
        if index == 0:
            break
    stage_flow.fade = 0xff
    a_value = 0x3f
    ram[ppu_address] = 0x3f
    a_value = 0
    ram[ppu_address] = 0
    ram[ppu_address] = 0
    ram[ppu_address] = 0
    return 0

def load_fixed_sprite_palette():
    x_value = 0
    y_value = 0x10
    a_value = 0x3f
    ram[ppu_address] = 0x3f
    ram[ppu_address] = 0x10
    slot = 0
    index = 0x10
    while True:
        next_ppu_data = ram[0xd555 + slot]
        ram[ppu_data] = next_ppu_data
        slot = byte(slot + 1)
        index = byte(index - 1)
        if index == 0:
            break
    return next_ppu_data

def wait_for_vblank_flag():
    while True:
        ppu_status_value = ram[ppu_status]
        if ppu_status_value & 0x80:
            break
    return ppu_status_value

def encode_tile_coordinates_to_ppu_address(tile_x, tile_y):
    ram[scratch] = 0
    scratch_value = ram[scratch]
    value = (scratch_value >> 1) + ((tile_y & 1) << 7)
    ram[scratch] = value
    scaled_scratch_value_0 = shift_byte_right_1(scratch_value)
    scratch_value = ram[scratch]
    value = (scratch_value >> 1) + (((tile_y >> 1) & 1) << 7)
    ram[scratch] = value
    scratch_value = ram[scratch]
    value = (scratch_value >> 1) + (((tile_y >> 2) & 1) << 7)
    ram[scratch] = value
    push(tile_y >> 3)
    scratch_value2 = ram[scratch]
    address_low = tile_x | scratch_value2
    saved = pull()
    return saved | 4, address_low

def queue_attribute_table_byte_update(tile_x, tile_y):
    attribute_byte, index = update_attribute_quadrant_bits(slot=tile_x, index=tile_y)
    vram_cursor_value = ram[vram_cursor]
    vram_command_buffer[vram_cursor_value] = 0x23
    slot2 = byte(vram_cursor_value + 1)
    vram_command_buffer[slot2] = byte(index + 0xc0)
    next_vram_command_buffer = ram[map_collision_workspace + 960 + index]
    slot3 = byte(slot2 + 1)
    vram_command_buffer[slot3] = next_vram_command_buffer
    slot4 = byte(slot3 + 1)
    vram_command_buffer[slot4] = 0xff
    ram[vram_cursor] = byte(slot4 + 1)
    return 0xff

def update_attribute_quadrant_bits(slot, index):
    value = video.attributes
    shift_attribute_value_and_or_base(value=value)
    shift_attribute_value_and_or_base()
    next_ram = shift_attribute_value_and_or_base()
    ram[0x02] = next_ram
    if index & 2:
        if not (slot & 2):
            value6 = 0xcf
        else:
            value6 = 0x3f
    else:
        if not (slot & 2):
            value6 = 0xfc
        else:
            value6 = 0xf3
    ram[0x01] = value6
    scaled_index_0 = shift_byte_left_1_value(index)
    ram[scratch] = (index << 1) & 0xf8
    scaled_slot_1 = shift_byte_right_2(slot)
    scratch_value = ram[scratch]
    value16 = ram[0x01]
    mem_02 = ram[0x02]
    ram[0x02] = (value16 ^ 0xff) & mem_02
    direction = byte((scaled_slot_1) + scratch_value)
    value19 = ram[map_collision_workspace + 960 + direction]
    mem_01 = ram[0x01]
    mem_02 = ram[0x02]
    ram[map_collision_workspace + 960 + direction] = (value19 & mem_01) | mem_02
    return (value19 & mem_01) | mem_02, direction

def shift_attribute_value_and_or_base(value):
    scaled_value_0 = shift_byte_left_2(value)
    mem_04 = video.attributes
    return (scaled_value_0) | mem_04

def poll_controllers():
    x_value = 1
    ram[controller_strobe] = 1
    y_value = 0
    ram[controller_strobe] = 0
    slot = 1
    index = 0
    while True:
        ram[scratch] = index
        index = 8
        while True:
            port_bits = controller_strobe[slot]
            scratch_value = ram[scratch]
            next_scratch = (scratch_value >> 1) + (int((port_bits & 3) >= 1) << 7)
            ram[scratch] = next_scratch
            scaled_scratch_value_0 = shift_byte_right_1(scratch_value)
            index = byte(index - 1)
            if index == 0:
                break
        held = input_state[slot].held
        scratch_value2 = ram[scratch]
        input_state[slot].pressed = (held ^ 0xff) & scratch_value2
        next_pad_current = ram[scratch]
        input_state[slot].held = next_pad_current
        slot = byte(slot - 1)
        if slot & 0x80:
            break
    return next_pad_current

def queue_ff_terminated_vram_string(tile_x, tile_y):
    next_generic_map_vram_source_pointers, index = encode_tile_coordinates_to_ppu_address(tile_x=tile_x, tile_y=tile_y)
    generic_map_vram_source_pointers[3] = next_generic_map_vram_source_pointers
    mem_05 = video.background_bank
    vram_cursor_value = ram[vram_cursor]
    vram_command_buffer[vram_cursor_value] = byte(next_generic_map_vram_source_pointers + mem_05)
    slot2 = byte(vram_cursor_value + 1)
    vram_command_buffer[slot2] = index
    generic_map_vram_source_pointers[2] = index
    slot3 = byte(slot2 + 1)
    index2 = 0
    while True:
        value3 = ram[read_word(generic_map_vram_source_pointers) + index2]
        vram_command_buffer[slot3] = value3
        x_value = byte(slot3 + 1)
        if value3 != 0xff:
            ram[read_word(0x13) + index2] = value3
            slot3 = byte(slot3 + 1)
            index2 = byte(index2 + 1)
            continue
        break
    ram[vram_cursor] = byte(slot3 + 1)
    return value3

def queue_offset_ff_terminated_vram_string(tile_x, tile_y):
    result, next_vram_command_buffer = encode_tile_coordinates_to_ppu_address(tile_x=tile_x, tile_y=tile_y)
    mem_05 = video.background_bank
    vram_cursor_value = ram[vram_cursor]
    vram_command_buffer[vram_cursor_value] = byte(result + mem_05)
    slot2 = byte(vram_cursor_value + 1)
    vram_command_buffer[slot2] = next_vram_command_buffer
    slot3 = byte(slot2 + 1)
    index2 = 0
    while True:
        value3 = ram[read_word(generic_map_vram_source_pointers) + index2]
        if not (value3 & 0x80):
            mem_60 = video.text_offset
            value3 = byte(value3 + mem_60)
        vram_command_buffer[slot3] = value3
        x_value = byte(slot3 + 1)
        if value3 != 0xff:
            slot3 = byte(slot3 + 1)
            index2 = byte(index2 + 1)
            continue
        break
    ram[vram_cursor] = byte(slot3 + 1)
    return value3

def divide_xy_then_setup_vram_pointer(pixel_x, pixel_y):
    tile_x, tile_y = divide_xy_by_eight(pixel_x=pixel_x, pixel_y=pixel_y)
    return set_vram_pointer_from_tile_coordinates(tile_x=tile_x, tile_y=tile_y)

def set_vram_pointer_from_tile_coordinates(tile_x, tile_y):
    address_high, address_low = encode_tile_coordinates_to_ppu_address(tile_x=tile_x, tile_y=tile_y)
    generic_map_vram_source_pointers[1] = address_high
    ram[generic_map_vram_source_pointers] = address_low
    column = 0
    return address_high, column

def divide_xy_by_eight(pixel_x, pixel_y):
    tile_y = shift_byte_right_3_value(pixel_y)
    tile_x = shift_byte_right_3(pixel_x)
    return tile_x, tile_y

def setup_attribute_mask_from_coordinates(slot, index):
    ram[probe_x] = slot
    ram[probe_y] = index
    divide_xy_then_setup_vram_pointer(pixel_x=slot, pixel_y=index)
    fall_into(compute_attribute_quadrant_mask)

def compute_attribute_quadrant_mask():
    ram[scratch] = 1
    probe_y_value = ram[probe_y]
    if probe_y_value & 4:
        scratch_value = ram[scratch]
        next_scratch = byte(scratch_value << 1)
        ram[scratch] = next_scratch
        scaled_scratch_value_0 = shift_byte_left_1(scratch_value)
        scratch_value2 = ram[scratch]
        value3 = byte(scratch_value2 << 1)
        ram[scratch] = value3
        scaled_scratch_value2_1 = shift_byte_left_1(scratch_value2)
    probe_x_value = ram[probe_x]
    if probe_x_value & 4:
        scratch_value = ram[scratch]
        next_scratch = byte(scratch_value << 1)
        ram[scratch] = next_scratch
        scaled_scratch_value_2 = shift_byte_left_1(scratch_value)
    return

def test_cell_high_nibble_with_mask(cell_offset):
    scratch_value = ram[scratch]
    cell = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    return (scratch_value | 0xf0) & cell

def clear_cell_mask_and_queue_update(tank_slot, cell_offset):
    scratch_value = ram[scratch]
    cell = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    store_cell_and_queue_single_vram_update(value=(scratch_value ^ 0xff) & cell, slot=tank_slot, cell_offset=cell_offset)
    return

def clear_cell_mask_if_high_nibble_present(cell_offset):
    value = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    if not (high_nibble(value)):
        scratch_value = ram[scratch]
        cell = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
        ram[read_word(generic_map_vram_source_pointers) + cell_offset] = (scratch_value ^ 0xff) & cell
    return

def set_cell_mask_if_high_nibble_present(cell_offset):
    value = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    if not (high_nibble(value)):
        scratch_value = ram[scratch]
        cell = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
        ram[read_word(generic_map_vram_source_pointers) + cell_offset] = scratch_value | cell
    return

def write_pointed_cell_to_ppu(cell_offset):
    value = generic_map_vram_source_pointers[1]
    mem_05 = video.background_bank
    a_value = value + mem_05
    a_value2 = (value + mem_05) & 0xff
    ram[ppu_address] = byte(value + mem_05)
    next_ppu_address = ram[generic_map_vram_source_pointers]
    ram[ppu_address] = next_ppu_address
    next_ppu_data = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    ram[ppu_data] = next_ppu_data
    return next_ppu_data

def store_cell_and_queue_single_vram_update(slot, value, cell_offset):
    ram[read_word(generic_map_vram_source_pointers) + cell_offset] = value
    ram[probe_x] = slot
    vram_cursor_value = ram[vram_cursor]
    value2 = generic_map_vram_source_pointers[1]
    vram_command_buffer[vram_cursor_value] = byte(value2 + 28)
    next_vram_command_buffer = ram[generic_map_vram_source_pointers]
    slot3 = byte(vram_cursor_value + 1)
    vram_command_buffer[slot3] = next_vram_command_buffer
    value5 = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    slot4 = byte(slot3 + 1)
    vram_command_buffer[slot4] = value5
    slot5 = byte(slot4 + 1)
    vram_command_buffer[slot5] = 0xff
    ram[vram_cursor] = byte(slot5 + 1)
    slot7 = ram[probe_x]
    return 0xff

def add_a_to_word_11_12(value):
    mem_11 = ram[generic_map_vram_source_pointers]
    ram[generic_map_vram_source_pointers] = byte(value + mem_11)
    if (value + mem_11) > 0xff:
        next_generic_map_vram_source_pointers = byte(generic_map_vram_source_pointers[1] + 1)
        generic_map_vram_source_pointers[1] = next_generic_map_vram_source_pointers
    return

def repeat_d771_over_0400_to_07ff():
    ram[generic_map_vram_source_pointers] = 0
    generic_map_vram_source_pointers[1] = 4
    while True:
        write_pointed_cell_to_ppu()
        add_a_to_word_11_12(value=1)
        value4 = generic_map_vram_source_pointers[1]
        if value4 == 8:
            break
    return value4

def initialize_ram_and_clear_generated_blocks():
    value = 0x11
    slot = 0
    while True:
        map_collision_workspace[slot] = value
        ram[map_collision_workspace + 256 + slot] = value
        ram[map_collision_workspace + 512 + slot] = value
        ram[map_collision_workspace + 768 + slot] = value
        slot = byte(slot + 1)
        if slot == 0:
            break
    next_ram = 0
    slot2 = 0xc0
    while True:
        ram[map_collision_workspace + 768 + slot2] = next_ram
        slot2 = byte(slot2 + 1)
        if slot2 == 0:
            break
    slot3 = ram[0x56]
    index = ram[0x57]
    encode_tile_coordinates_to_ppu_address(tile_x=slot3, tile_y=index)
    next_generic_map_vram_source_pointers = a
    index2 = y
    generic_map_vram_source_pointers[1] = next_generic_map_vram_source_pointers
    ram[generic_map_vram_source_pointers] = index2
    while True:
        inner = ram[loop_inner]
        index3 = byte(inner - 1)
        while True:
            ram[read_word(generic_map_vram_source_pointers) + index3] = 0
            index3 = byte(index3 - 1)
            if index3 & 0x80:
                break
        value = byte(ram[loop_slot] - 1)
        ram[loop_slot] = value
        if value != 0:
            add_a_to_word_11_12(value=0x20, y=index3)
            continue
        break
    return 0

def render_four_table_selected_parts(value, pixel_x, pixel_y):
    push(value)
    ram[scratch] = value
    next_probe_x, next_probe_y = divide_xy_by_eight(pixel_x=pixel_x, pixel_y=pixel_y)
    ram[probe_x] = next_probe_x
    ram[probe_y] = next_probe_y
    scratch_value = ram[scratch]
    next_ram = ram[0xdabb + scratch_value]
    video.attributes = next_ram
    probe_y_value = ram[probe_y]
    queue_attribute_table_byte_update(tile_x=next_probe_x, tile_y=probe_y_value)
    value3 = ram[probe_y]
    probe_x_value = ram[probe_x]
    set_vram_pointer_from_tile_coordinates(a=probe_x_value & 0xfe, tile_x=probe_x_value & 0xfe, tile_y=value3 & 0xfe)
    saved = pull()
    scaled_saved_0 = shift_byte_left_2(saved)
    slot4 = scaled_saved_0
    value9 = ram[0xdacb + slot4]
    store_cell_and_queue_single_vram_update(value=value9, slot=byte(slot4 + 1))
    slot6 = x
    add_a_to_word_11_12(value=1)
    value11 = ram[0xdacb + slot6]
    store_cell_and_queue_single_vram_update(value=value11, slot=byte(slot6 + 1))
    slot8 = x
    add_a_to_word_11_12(value=0x1f)
    value13 = ram[0xdacb + slot8]
    store_cell_and_queue_single_vram_update(value=value13, slot=byte(slot8 + 1))
    slot10 = x
    add_a_to_word_11_12(value=1)
    value15 = ram[0xdacb + slot10]
    store_cell_and_queue_single_vram_update(value=value15, slot=byte(slot10 + 1))
    return

def read_eight_ppu_bytes_and_process_bits(slot, index, value):
    ram[0x5d] = slot
    ram[0x5e] = byte(index + 32)
    ram[generic_map_vram_source_pointers] = 0
    generic_map_vram_source_pointers[1] = 0x10
    slot2 = value
    while True:
        x_value = (slot2 - 1) & 0xff
        if ((slot2 - 1) & 0x80) == 0:
            add_a_to_word_11_12(value=0x10)
            slot2 = byte(slot2 - 1)
            continue
        break
    next_ppu_address = generic_map_vram_source_pointers[1]
    ram[ppu_address] = next_ppu_address
    value8 = ram[generic_map_vram_source_pointers]
    ram[ppu_address] = value8
    value9 = ram[ppu_data]
    ram[loop_slot] = 8
    while True:
        ppu_data_value = ram[ppu_data]
        push(ppu_data_value)
        value = byte(ram[loop_slot] - 1)
        ram[loop_slot] = value
        if value == 0:
            break
    ram[loop_slot] = 8
    while True:
        saved = pull()
        ram[0x02] = saved
        ram[0x03] = 0x80
        while True:
            slot3 = ram[0x5d]
            index2 = ram[0x5e]
            setup_attribute_mask_from_coordinates(slot=slot3, index=index2)
            value14 = ram[0x02]
            mem_03 = ram[0x03]
            if (value14 & mem_03) == 0:
                clear_cell_mask_if_high_nibble_present()
            else:
                set_cell_mask_if_high_nibble_present()
            value16 = ram[0x5d]
            ram[0x5d] = byte(value16 + 4)
            mem_03 = ram[0x03]
            value = mem_03 >> 1
            ram[0x03] = value
            if mem_03 & 1:
                break
        value18 = ram[0x5d]
        ram[0x5d] = byte(value18 - 32)
        value20 = ram[0x5e]
        ram[0x5e] = byte(value20 - 4)
        value = byte(ram[loop_slot] - 1)
        ram[loop_slot] = value
        if value == 0:
            break
    return byte(value20 - 4)

def process_consecutive_ff_source_entries():
    ram[0x5f] = 0
    index = 0
    while True:
        value = ram[read_word(0x13) + index]
        if value != 0xff:
            ram[0x5f] = byte(index + 1)
            slot = ram[0x56]
            index3 = ram[0x57]
            mem_60 = video.text_offset
            read_eight_ppu_bytes_and_process_bits(value=byte(value + mem_60), slot=slot, index=index3)
            value3 = ram[0x56]
            ram[0x56] = byte(value3 + 32)
            index = ram[0x5f]
            continue
        break
    return value

def wait_next_frame():
    frame = world.frame
    while True:
        frame2 = world.frame
        if frame != frame2:
            break
    return frame

def flush_vram_buffer():
    vram_cursor_value = ram[vram_cursor]
    vram_command_buffer[vram_cursor_value] = 0
    slot2 = 0
    while True:
        mem_0c = ram[vram_cursor]
        if slot2 != mem_0c:
            next_ppu_address = vram_command_buffer[slot2]
            x_value = byte(slot2 + 1)
            ram[ppu_address] = next_ppu_address
            slot3 = byte(slot2 + 1)
            vram_command_buffer_value = vram_command_buffer[slot3]
            x_value = byte(slot3 + 1)
            ram[ppu_address] = vram_command_buffer_value
            slot2 = byte(slot3 + 1)
            while True:
                value4 = vram_command_buffer[slot2]
                slot2 = byte(slot2 + 1)
                if value4 != 0xff:
                    label block_d929:
                    ram[ppu_data] = value4
                    continue
                value5 = vram_command_buffer[slot2]
                if value5 == 0xff:
                    value4 = ram[0x17f + slot2]
                    goto block_d929
                break
        else:
            break
    ram[vram_cursor] = 0
    return 0

def scan_zero_page_to_zero_or_ff(slot, index):
    while True:
        scratch_value = ram[scratch + index]
        if scratch_value == 0:
            slot = byte(slot + 1)
            index = byte(index + 1)
            continue
        break
    if scratch_value == 0xff:
        value = ram[0x6b]
        if value == 0:
            slot = byte(slot - 1)
            index = byte(index - 1)
        x_value = byte(slot - 1)
        index = byte(index - 1)
    generic_map_vram_source_pointers[1] = 0
    ram[generic_map_vram_source_pointers] = index
    return 0

def configure_and_process_data_after_zero_prefix():
    ram[0x56] = 0x10
    ram[0x57] = 0x64
    video.text_offset = 0x30
    index = 0x3d
    while True:
        scratch_value = ram[scratch + index]
        if scratch_value == 0:
            value4 = ram[0x56]
            ram[0x56] = byte(value4 + 32)
            index = byte(index + 1)
            continue
        break
    generic_map_vram_source_pointers[3] = 0
    generic_map_vram_source_pointers[2] = index
    process_consecutive_ff_source_entries()
    video.text_offset = 0
    return 0

def compare_and_conditionally_copy_two_7byte_arrays():
    winner: int = 0
    slot = 0
    while True:
        value = two_seven_digit_score_records[slot]
        mem_3d = maximum_score_digits[slot]
        if value != mem_3d:
            if ((value - mem_3d) & 0x80) == 0:
                slot2 = 0
                while True:
                    next_maximum_score_digits = two_seven_digit_score_records[slot2]
                    maximum_score_digits[slot2] = next_maximum_score_digits
                    difference = (byte(slot2 + 1)) - 7
                    slot2 = byte(slot2 + 1)
                    if slot2 == 7:
                        break
                winner = 1
                break
            break
        difference = (byte(slot + 1)) - 7
        slot = byte(slot + 1)
        if slot != 7:
            continue
        break
    slot3 = 0
    while True:
        value3 = two_seven_digit_score_records[slot3 + 8]
        mem_3d = maximum_score_digits[slot3]
        if value3 != mem_3d:
            if ((value3 - mem_3d) & 0x80) == 0:
                slot4 = 0
                while True:
                    value4 = two_seven_digit_score_records[slot4 + 8]
                    maximum_score_digits[slot4] = value4
                    difference = (byte(slot4 + 1)) - 7
                    slot4 = byte(slot4 + 1)
                    if slot4 == 7:
                        break
                winner = 0xff
                break
            break
        difference = (byte(slot3 + 1)) - 7
        slot3 = byte(slot3 + 1)
        if slot3 != 7:
            continue
        break
    return winner

def add_seven_decimal_digits(slot):
    carry_in: int = 0
    record_base = shift_byte_left_3(slot)
    score_offset = byte(record_base + 6)
    digit_index = 6
    while True:
        addend = ram[score_addend_digits + digit_index]
        current_digit = two_seven_digit_score_records[score_offset]
        next_digit, carry_in = add_decimal_digit(addend, current_digit, carry_in)
        two_seven_digit_score_records[score_offset] = next_digit
        score_offset = byte(score_offset - 1)
        digit_index = byte(digit_index - 1)
        if digit_index & 0x80:
            break
    return next_digit

def initialize_score_increment_record(value):
    ram[scratch] = value
    clear_seven_bytes_set_ff_sentinel(base=0x35)
    scratch_value = ram[scratch]
    if scratch_value == 0:
        score_addend_digits[3] = 1
        return 1
    score_addend_digits[5] = low_nibble(scratch_value)
    scratch_value2 = ram[scratch]
    scaled_scratch_value2_0 = shift_byte_right_4(scratch_value2)
    score_addend_digits[4] = scaled_scratch_value2_0
    return scaled_scratch_value2_0

def clear_seven_bytes_set_ff_sentinel(base):
    ram[byte(base)] = 0
    ram[0x01 + base] = 0
    ram[0x02 + base] = 0
    ram[0x03 + base] = 0
    ram[0x04 + base] = 0
    ram[byte(0x05 + base)] = 0
    ram[byte(0x06 + base)] = 0
    ram[byte(0x07 + base)] = 0xff
    return 0xff

def store_value_as_tens_and_ones(value):
    ram[scratch] = value
    clear_seven_bytes_set_ff_sentinel(base=0x35)
    scratch_value = ram[scratch]
    while True:
        if scratch_value >= 10:
            value = byte(score_addend_digits[5] + 1)
            score_addend_digits[5] = value
            scratch_value = byte(scratch_value - 10)
            continue
        break
    score_addend_digits[6] = scratch_value
    return scratch_value

def emit_sprite(pixel_x, pixel_y):
    ram[probe_x] = pixel_x
    ram[probe_y] = byte(pixel_y - 8)
    divide_xy_then_setup_vram_pointer(a=byte(pixel_y - 8), pixel_x=byte(pixel_x + 3), pixel_y=pixel_y)
    value5 = ram[read_word(generic_map_vram_source_pointers) + y]
    if value5 == 0x22:
        value6 = video.attributes
        mem_6e = video.attribute_mask
        video.attributes = value6 | mem_6e
    sprite_cursor_value = ram[sprite_cursor]
    next_oam_shadow = ram[probe_y]
    oam_shadow[sprite_cursor_value] = next_oam_shadow
    next_ram = video.tile
    ram[oam_shadow + 1 + sprite_cursor_value] = next_ram
    value10 = video.attributes
    ram[oam_shadow + 2 + sprite_cursor_value] = value10
    probe_x_value = ram[probe_x]
    ram[oam_shadow + 3 + sprite_cursor_value] = probe_x_value
    mem_0e = ram[0x0e]
    ram[sprite_cursor] = byte(sprite_cursor_value + mem_0e)
    return byte(sprite_cursor_value + mem_0e)

def emit_sprite_with_tile_plus_twice_a(slot, value, pixel_y):
    scaled_value_0 = shift_byte_left_1(value)
    mem_53 = video.tile
    video.tile = byte((scaled_value_0) + mem_53)
    emit_sprite(a=byte(slot - 5), pixel_x=byte(slot - 5), pixel_y=pixel_y)
    return

def add_eight_times_a_to_tile_then_emit_pair(value, pixel_x, pixel_y):
    scaled_value_0 = shift_byte_left_3(value)
    mem_53 = video.tile
    video.tile = byte((scaled_value_0) + mem_53)
    return emit_horizontal_sprite_pair(slot=pixel_x, index=pixel_y)

def emit_horizontal_sprite_pair(slot, index):
    ram[step_sign_x] = slot
    ram[step_sign_y] = index
    emit_sprite(a=byte(slot - 8), pixel_x=byte(slot - 8), pixel_y=index)
    next_sprite_tile = byte(video.tile + 1)
    video.tile = next_sprite_tile
    value2 = byte(video.tile + 1)
    video.tile = value2
    step_sign_x_value = ram[step_sign_x]
    step_sign_y_value = ram[step_sign_y]
    emit_sprite(pixel_x=step_sign_x_value, pixel_y=step_sign_y_value)
    return

def hide_unused_sprites():
    slot = ram[sprite_cursor]
    value = ram[0x0e]
    ram[0x0e] = byte((value ^ 0xff) + 1)
    while True:
        mem_0e = ram[0x0e]
        a_value = slot + mem_0e
        a_value2 = byte(slot + mem_0e)
        slot_before = slot
        slot = byte(slot_before + mem_0e)
        oam_shadow[slot] = 0xf0
        if slot == 4:
            break
    ram[sprite_cursor] = slot
    return 0xf0

def comparison_flags_to_signed_unit(difference, nonnegative):
    result: int = difference
    if difference != 0:
        if nonnegative:
            result = 1
        else:
            result = 0xff
    return result

def update_0311_from_two_slot_idle_checks():
    engine_sound_on = audio_commands_and_event_flags[17]
    if engine_sound_on == 0:
        player1_driving = test_slot_no_directional_input_and_no_tank_state(slot=0)
        if player1_driving != 0:
            audio_commands_and_event_flags[17] = 1
        else:
            player2_driving = test_slot_no_directional_input_and_no_tank_state(slot=1)
            if player2_driving != 0:
                audio_commands_and_event_flags[17] = 1
        return
    player1_driving2 = test_slot_no_directional_input_and_no_tank_state(slot=0)
    if player1_driving2 != 0:
        return
    player2_driving2 = test_slot_no_directional_input_and_no_tank_state(slot=1)
    if player2_driving2 != 0:
        return
    audio_commands_and_event_flags[17] = 0
    return 0

def test_slot_no_directional_input_and_no_tank_state(slot):
    held = input_state[slot].held
    if not (high_nibble(held)):
        return 0
    state = tanks[slot].state
    if state == 0:
        return 0
    return 1

def tick_enemy_spawn():
    value = round_state.spawn_delay
    if value == 0:
        value2 = round_state.enemies_remaining
        if value2 == 0:
            return
        next_loop_slot = ram[enemy_spawn_start_slot]
        ram[loop_slot] = next_loop_slot
        while True:
            slot = ram[loop_slot]
            state = tanks[slot].state
            if state != 0:
                value = byte(ram[loop_slot] - 1)
                ram[loop_slot] = value
                slot4 = ram[loop_slot]
                if slot4 == 1:
                    return
            else:
                next_title_repeat_and_enemy_spawn_delay = round_state.spawn_interval
                round_state.spawn_delay = next_title_repeat_and_enemy_spawn_delay
                initialize_tank_slot(slot=slot)
                value = byte(round_state.enemies_remaining - 1)
                round_state.enemies_remaining = value
                value5 = round_state.enemies_remaining
                draw_d36b_text_at_packed_index(packed_index=value5)
                return
    else:
        value2 = byte(round_state.spawn_delay - 1)
        round_state.spawn_delay = value2
        return value

def apply_player_direction():
    frame = world.frame
    if not (frame & 1):
        frame2 = world.frame
        if frame2 & 3:
            fall_into(return_from_player_direction_update)
    for slot in reverse_byte_values(2):
        state = tanks[slot].state
        if not (state & 0x80):
            continue
        if not (state < 0xe0):
            continue
        cooldown = control_cooldown[slot]
        if cooldown != 0:
            next_control_cooldown = byte(control_cooldown[slot] - 1)
            control_cooldown[slot] = next_control_cooldown
            merge_tank_state_low_nibble(new_tank_state_class=0x80, tank_slot=slot)
            idle_state = tanks[slot].state
            tanks[slot].state = 8 | idle_state
            continue
        flags = tanks[slot].flags
        if flags & 0x80:
            if flags & 0x10:
                merge_tank_state_low_nibble(new_tank_state_class=0x80, tank_slot=slot)
                idle_state = tanks[slot].state
                tanks[slot].state = 8 | idle_state
                continue
        held = input_state[slot].held
        direction = input_to_direction(held=held)
        ram[scratch] = direction
        if direction == NO_DIRECTION:
            merge_tank_state_low_nibble(new_tank_state_class=0x80, tank_slot=slot)
            idle_state = tanks[slot].state
            tanks[slot].state = 8 | idle_state
            continue
        flags2 = tanks[slot].flags
        if flags2 & 0x80:
            if not (flags2 & 0x1f):
                tanks[slot].flags = 0x9c
                audio_commands_and_event_flags[16] = 1
        state2 = tanks[slot].state
        requested_direction = ram[scratch]
        turn_delta = (state2 & 3) - requested_direction
        current_direction = state2 & 3
        if current_direction != requested_direction:
            requested_direction2 = ram[scratch]
            if (current_direction ^ 2) != requested_direction2:
                x_pos = tanks[slot].x
                snapped_x = snap_to_tile_grid(x_pos)
                tanks[slot].x = snapped_x
                y_pos = tanks[slot].y
                snapped_y = snap_to_tile_grid(y_pos)
                tanks[slot].y = snapped_y
        requested_direction = ram[scratch]
        tanks[slot].state = requested_direction | 0xa0
    fall_into(return_from_player_direction_update)

def return_from_player_direction_update():
    return

def tick_tank_states():
    ram[loop_slot] = 7
    value2 = round_state.enemy_freeze
    if value2 != 0:
        frame = world.frame
        if not (frame & 0x3f):
            value = byte(round_state.enemy_freeze - 1)
            round_state.enemy_freeze = value
    for slot in remaining_byte_slots(loop_slot):
        if slot >= 2:
            value6 = round_state.enemy_freeze
            if value6 != 0:
                state = tanks[slot].state
                if state & 0x80:
                    if state < 0xe0:
                        continue
            attributes = tanks[slot].attributes
            if (high_nibble(attributes)) != 0xa0:
                slot2 = ram[loop_slot]
                frame = world.frame
                if ((slot2 ^ frame) & 1) == 0:
                    continue
        else:
            frame2 = world.frame
            if not (frame2 & 1):
                frame3 = world.frame
                if frame3 & 3:
                    continue
        dispatch_tank_state()
    return

def tank_state_dispatch(tank_slot):
    state = tanks[tank_slot].state
    scaled_state_0 = shift_byte_right_3(state)
    direction = (scaled_state_0) & 0xfe
    next_generic_map_vram_source_pointers = ram[0xe498 + direction]
    ram[generic_map_vram_source_pointers] = next_generic_map_vram_source_pointers
    value6 = ram[0xe499 + direction]
    generic_map_vram_source_pointers[1] = value6
    jump(indirect_word(0x0011))

def advance_tank_with_map_probes(slot):
    while True:
        state = tanks[slot].state
        direction = state & 3
        unit_dy = bullet_dy_table[direction]
        step_y8 = shift_byte_left_3(unit_dy)
        ram[work_step_y] = step_y8
        unit_dy_reread = bullet_dy_table[direction]
        y_pos = tanks[slot].y
        ram[work_y] = byte(unit_dy_reread + y_pos)
        unit_dx = bullet_dx_table[direction]
        step_x8 = shift_byte_left_3(unit_dx)
        ram[work_step_x] = step_x8
        unit_dx_reread = bullet_dx_table[direction]
        x_pos = tanks[slot].x
        ram[work_x] = byte(unit_dx_reread + x_pos)
        step_x = ram[work_step_x]
        step_y = ram[work_step_y]
        front_corner_x = pull_probe_inside_tank_x(value=byte(byte(byte(unit_dx_reread + x_pos) + step_x) + step_y))
        proposed_y = ram[work_y]
        step_x = ram[work_step_x]
        step_y = ram[work_step_y]
        front_corner_y = pull_probe_inside_tank_y(value=byte(byte(proposed_y + step_x) + step_y))
        _, column = divide_xy_then_setup_vram_pointer(pixel_x=front_corner_x, pixel_y=front_corner_y)
        front_cell = ram[read_word(generic_map_vram_source_pointers) + column]
        if front_cell & 0x80:
            break
        if front_cell != 0:
            if front_cell < 32:
                break
        proposed_x = ram[work_x]
        step_x = ram[work_step_x]
        step_y = ram[work_step_y]
        side_corner_x = pull_probe_inside_tank_x(value=byte(byte(proposed_x + step_x) - step_y))
        proposed_y = ram[work_y]
        step_y = ram[work_step_y]
        step_x = ram[work_step_x]
        side_corner_y = pull_probe_inside_tank_y(value=byte(byte(proposed_y + step_y) - step_x))
        _, column2 = divide_xy_then_setup_vram_pointer(pixel_x=side_corner_x, pixel_y=side_corner_y)
        side_cell = ram[read_word(generic_map_vram_source_pointers) + column2]
        if side_cell & 0x80:
            break
        if side_cell != 0:
            if side_cell < 32:
                break
        slot7 = ram[loop_slot]
        next_x = ram[work_x]
        tanks[slot7].x = next_x
        next_y = ram[work_y]
        tanks[slot7].y = next_y
        sprite_phase = tank_sprite_phase_or_flip[slot7]
        tank_sprite_phase_or_flip[slot7] = sprite_phase ^ 4
        return sprite_phase ^ 4
    slot7 = ram[loop_slot]
    if slot7 < 2:
        sprite_phase = tank_sprite_phase_or_flip[slot7]
        tank_sprite_phase_or_flip[slot7] = sprite_phase ^ 4
        return sprite_phase ^ 4
    random2, slot7 = random_byte(slot=slot7)
    if not (random2 & 3):
        x_pos2 = tanks[slot7].x
        if not (x_pos2 & 7):
            y_pos2 = tanks[slot7].y
            if not (y_pos2 & 7):
                merge_tank_state_low_nibble(new_tank_state_class=0x90, tank_slot=slot7)
        state2 = tanks[slot7].state
        tanks[slot7].state = state2 ^ 2
        return state2 ^ 2
    merge_tank_state_low_nibble(new_tank_state_class=0x80, tank_slot=slot7)
    state = tanks[slot7].state
    tanks[slot7].state = 8 | state
    sprite_phase = tank_sprite_phase_or_flip[slot7]
    tank_sprite_phase_or_flip[slot7] = sprite_phase ^ 4
    return sprite_phase ^ 4

def decrement_tank_state_phase(slot):
    while True:
        if slot >= 2:
            break
        flags = tanks[slot].flags
        if not (flags & 0x80):
            break
        if not (flags & 0x7f):
            break
        next_flags = byte(tanks[slot].flags - 1)
        tanks[slot].flags = next_flags
        value2 = tank_sprite_phase_or_flip[slot]
        tank_sprite_phase_or_flip[slot] = value2 ^ 4
        return advance_tank_with_map_probes(slot)
    state = tanks[slot].state
    tanks[slot].state = byte(state - 4)
    if ((state - 4) & 0x0c) == 0:
        merge_tank_state_low_nibble(new_tank_state_class=0xa0, tank_slot=slot)
    return

def maybe_retarget_aligned_tank(slot):
    if slot >= 2:
        x_pos = tanks[slot].x
        if not (x_pos & 7):
            y_pos = tanks[slot].y
            if not (y_pos & 7):
                random, slot = random_byte(slot=slot)
                if not low_nibble(random):
                    select_tank_action_from_timer_and_frame(slot=slot)
                    return
    return advance_tank_with_map_probes(slot)

def randomize_tank_direction_or_retarget(tank_slot):
    random, _ = random_byte(slot=tank_slot)
    if not (random & 1):
        select_tank_action_from_timer_and_frame(slot=tank_slot)
        return
    random2, slot2 = random_byte(slot=tank_slot)
    if not (random2 & 1):
        state2 = tanks[slot2].state
        value3 = byte(state2 - 1)
    else:
        state = tanks[slot2].state
        value3 = byte(state + 1)
    tanks[slot2].state = (value3 & 3) | 0xa0
    return (value3 & 3) | 0xa0

def pull_probe_inside_tank_x(value):
    adjusted: int = value
    proposed_x = ram[work_x]
    if value >= proposed_x:
        unwrapped = value - 1
        adjusted = byte(value - 1)
    return adjusted

def pull_probe_inside_tank_y(value):
    adjusted: int = value
    proposed_y = ram[work_y]
    if value >= proposed_y:
        unwrapped = value - 1
        adjusted = byte(value - 1)
    return adjusted

def target_tank_zero_position_and_choose_state(tank_slot):
    x_pos = ram[tank_x]
    ram[target_x_target_y] = x_pos
    y_pos = ram[tank_y]
    target_x_target_y[1] = y_pos
    next_state, slot = map_target_tank_delta_to_direction_value(slot=tank_slot)
    tanks[slot].state = next_state
    return next_state

def target_secondary_player_position_and_choose_state(tank_slot):
    x_pos = tanks[1].x
    ram[target_x_target_y] = x_pos
    y_pos = tanks[1].y
    target_x_target_y[1] = y_pos
    next_state, slot = map_target_tank_delta_to_direction_value(slot=tank_slot)
    tanks[slot].state = next_state
    return next_state

def target_fixed_center_position_and_choose_state(tank_slot):
    ram[target_x_target_y] = 0x78
    target_x_target_y[1] = 0xd8
    next_state, slot = map_target_tank_delta_to_direction_value(slot=tank_slot)
    tanks[slot].state = next_state
    return next_state

def map_target_tank_delta_to_direction_value(slot):
    target_x = ram[target_x_target_y]
    x_pos = tanks[slot].x
    x_sign = comparison_flags_to_signed_unit(difference=byte(target_x - x_pos), nonnegative=(target_x >= x_pos))
    ram[delta_x] = byte(x_sign + 1)
    target_y = target_x_target_y[1]
    y_pos = tanks[slot].y
    y_sign = comparison_flags_to_signed_unit(difference=byte(target_y - y_pos), nonnegative=(target_y >= y_pos))
    ram[delta_y] = byte(y_sign + 1)
    doubled_y_step = shift_byte_left_1(byte(y_sign + 1))
    y_step = ram[delta_y]
    x_step = ram[delta_x]
    ram[delta_x] = byte(byte(doubled_y_step + y_step) + x_step)
    if slot >= 2:
        random, _ = random_byte(slot=slot)
        if random & 1:
            aim_code = ram[delta_x]
            aim_code = byte(AIM_TABLE_ALTERNATE_ROW + aim_code)
        else:
            aim_code = ram[delta_x]
    else:
        doubled_slot = shift_byte_left_1(slot)
        frame_hi = world.slow_frame
        if ((doubled_slot ^ frame_hi) & 2) == 0:
            aim_code = ram[delta_x]
        else:
            aim_code = ram[delta_x]
            aim_code = byte(AIM_TABLE_ALTERNATE_ROW + aim_code)
    direction_state = aim_direction_states[aim_code]
    return direction_state, slot

def advance_tank_destruction_state(slot):
    value = byte(tanks[slot].state - 1)
    tanks[slot].state = value
    state = tanks[slot].state
    if low_nibble(state):
        return
    state2 = tanks[slot].state
    phase_delta = state2 - 16
    phase_byte = (state2 - 16) & 0xff
    if state2 == 0x10:
        tanks[slot].state = byte(state2 - 16)
        if slot >= 2:
            value = byte(ram[0x80] - 1)
            ram[0x80] = value
            return byte(state2 - 16)
        value = byte(lives[slot] - 1)
        lives[slot] = value
        if value == 0:
            value4 = round_state.base_state
            if value4 != 0x80:
                return
            if slot == 1:
                life_count = ram[lives]
                if life_count == 0:
                    return
                transition.direction = 1
                transition.x = 0xc0
                set_transition_vector_and_reset_frame()
                return
            value5 = ram[0x52]
            if value5 == 0:
                return
            transition.direction = 3
            transition.x = 0x20
            set_transition_vector_and_reset_frame()
            return
        initialize_tank_slot(slot=slot)
        return
    if (byte(state2 - 16)) != 0x10:
        value3 = (byte(state2 - 16)) | 3
    else:
        value3 = (byte(state2 - 16)) | 6
    tanks[slot].state = value3
    return value3

def set_transition_vector_and_reset_frame():
    transition.lifetime = 0x0d
    transition.y = 0xd8
    world.frame = 0
    return 0

def increment_tank_state_until_e0(slot):
    next_state = byte(tanks[slot].state + 1)
    tanks[slot].state = next_state
    state = tanks[slot].state
    if (low_nibble(state)) == 0x0e:
        tanks[slot].state = 0xe0
    return

def increment_tank_state_and_finalize_phase(slot):
    next_state = byte(tanks[slot].state + 1)
    tanks[slot].state = next_state
    state = tanks[slot].state
    if (low_nibble(state)) == 0x0e:
        configure_spawned_tank_slot(slot=slot)
    return

def select_tank_action_from_timer_and_frame(slot):
    value = round_state.spawn_interval
    scaled_value_0 = shift_byte_right_2(value)
    frame_hi = world.slow_frame
    if (scaled_value_0) < frame_hi:
        steering_state = 0xb0
    else:
        scaled_scaled_value_0_1 = shift_byte_right_1(scaled_value_0)
        frame_hi = world.slow_frame
        if (value >> 3) >= frame_hi:
            random, slot2 = random_byte(slot=slot)
            tanks[slot2].state = (random & 3) | 0xa0
            return (random & 3) | 0xa0
        state = ram[tank_state]
        if state == 0:
            steering_state = 0xc0
        else:
            if not (slot & 1):
                steering_state = 0xd0
            else:
                state2 = tanks[1].state
                if state2 == 0:
                    steering_state = 0xd0
                else:
                    steering_state = 0xc0
    merge_tank_state_low_nibble(tank_slot=slot, new_tank_state_class=steering_state)
    return

def dispatch_all_eight_tank_render_handlers():
    ram[loop_slot] = 0
    while True:
        slot = ram[loop_slot]
        dispatch_tank_sprite_handler(tank_slot=slot)
        next_loop_slot = byte(ram[loop_slot] + 1)
        ram[loop_slot] = next_loop_slot
        slot3 = ram[loop_slot]
        if slot3 == 8:
            break
    return slot3

def dispatch_tank_sprite_handler(tank_slot):
    state = tanks[tank_slot].state
    scaled_state_0 = shift_byte_right_3(state)
    direction = (scaled_state_0) & 0xfe
    next_generic_map_vram_source_pointers = ram[0xe4b8 + direction]
    ram[generic_map_vram_source_pointers] = next_generic_map_vram_source_pointers
    value6 = ram[0xe4b9 + direction]
    generic_map_vram_source_pointers[1] = value6
    jump(indirect_word(0x0011))

def render_tank_from_state(slot):
    video.attribute_mask = 0
    state = tanks[slot].state
    push(state)
    y_pos = tanks[slot].y
    x_pos = tanks[slot].x
    saved = pull()
    transform_state_nibble_to_tile_offset(value=saved, pixel_x=x_pos, pixel_y=y_pos)
    video.attribute_mask = 0x20
    return 0x20

def transform_state_nibble_to_tile_offset(value, pixel_x, pixel_y):
    scaled_value_0 = shift_byte_right_4_value(value)
    a_value5 = (scaled_value_0) - 7
    a_value6 = ((scaled_value_0) - 7) & 0xff
    a_value7 = (((scaled_value_0) - 7) & 0xff) ^ 0xff
    a_value8 = ((((scaled_value_0) - 7) & 0xff) ^ 0xff) + 1
    a_value9 = (((((scaled_value_0) - 7) & 0xff) ^ 0xff) + 1) & 0xff
    carry_bit5 = ((((((scaled_value_0) - 7) & 0xff) ^ 0xff) + 1) & 0xff) >> 7
    a_value10 = (((((((scaled_value_0) - 7) & 0xff) ^ 0xff) + 1) & 0xff) << 1) & 0xff
    carry_bit6 = ((((((((scaled_value_0) - 7) & 0xff) ^ 0xff) + 1) & 0xff) << 1) & 0xff) >> 7
    a_value11 = byte((byte(((byte((scaled_value_0) - 7)) ^ 0xff) + 1)) << 2)
    return emit_sprite_pair_with_a_plus_f1_tile(value=a_value11, pixel_x=pixel_x, pixel_y=pixel_y)

def emit_sprite_pair_with_a_plus_f1_tile(value, pixel_x, pixel_y):
    video.tile = byte(value + 0xf1)
    video.attributes = 3
    emit_horizontal_sprite_pair(a=3, slot=pixel_x, index=pixel_y)
    return

def render_tank_by_attribute_mode(slot):
    video.attribute_mask = 0
    attributes = tanks[slot].attributes
    if attributes == 0:
        y_pos2 = tanks[slot].y
        x_pos2 = tanks[slot].x
        emit_sprite_pair_with_a_plus_f1_tile(value=0, pixel_x=x_pos2, pixel_y=y_pos2)
    else:
        attributes2 = tanks[slot].attributes
        scaled_attributes2_0 = shift_byte_right_3(attributes2)
        video.tile = byte((byte(((scaled_attributes2_0) & 0xfc) - 16)) + 0xb9)
        video.attributes = 3
        y_pos = tanks[slot].y
        x_pos = tanks[slot].x
        emit_horizontal_sprite_pair(a=x_pos, slot=x_pos, index=y_pos)
    video.attribute_mask = 0x20
    return 0x20

def render_tank_offset_effect(slot):
    video.attribute_mask = 0
    y_pos = tanks[slot].y
    x_pos = tanks[slot].x
    emit_sprite_pair_with_a_plus_f1_tile(value=8, pixel_x=x_pos, pixel_y=y_pos)
    video.attribute_mask = 0x20
    return 0x20

def render_four_quadrant_tank_effect():
    video.attributes = 3
    video.attribute_mask = 0
    x_pos, y_pos = prepare_tank_sprite_tile_and_position(value=0)
    emit_horizontal_sprite_pair(slot=byte(x_pos - 8), index=byte(y_pos - 8))
    x_pos2, y_pos2 = prepare_tank_sprite_tile_and_position(value=1)
    emit_horizontal_sprite_pair(slot=byte(x_pos2 + 8), index=byte(y_pos2 - 8))
    x_pos3, y_pos3 = prepare_tank_sprite_tile_and_position(value=2)
    emit_horizontal_sprite_pair(slot=byte(x_pos3 - 8), index=byte(y_pos3 + 8))
    x_pos4, y_pos4 = prepare_tank_sprite_tile_and_position(value=3)
    emit_horizontal_sprite_pair(slot=byte(x_pos4 + 8), index=byte(y_pos4 + 8))
    video.attribute_mask = 0x20
    return 0x20

def prepare_tank_sprite_tile_and_position(value):
    slot = ram[loop_slot]
    scaled_value_0 = shift_byte_left_2(value)
    ram[scratch] = byte((scaled_value_0) + 0xd1)
    state = tanks[slot].state
    scratch_value = ram[scratch]
    video.tile = byte(((byte((high_nibble(state)) - 48)) ^ 0x10) + scratch_value)
    y_pos = tank_y[slot]
    x_pos = tanks[slot].x
    return x_pos, y_pos

def render_tank_body_with_frame_selection(slot):
    if slot < 2:
        cooldown = control_cooldown[slot]
        if cooldown != 0:
            frame3 = world.frame
            if frame3 & 8:
                return frame3 & 8
        value6 = slot
        slot = value6
    else:
        attributes = tanks[slot].attributes
        if not (attributes & 4):
            frame2 = world.frame
            scaled_frame2_0 = shift_byte_left_2(frame2)
            attributes = tanks[slot].attributes
            palette_mix = byte((scaled_frame2_0) + attributes)
            direction = ((scaled_frame2_0) + attributes) & 7
            value6 = ram[0xe003 + direction]
        else:
            frame = world.frame
            scaled_frame_1 = shift_byte_right_3(frame)
            value6 = ((scaled_frame_1) & 1) + 2
    video.attributes = value6
    state = tanks[slot].state
    push(state & 3)
    attributes2 = tanks[slot].attributes
    mem_b0 = tank_sprite_phase_or_flip[slot]
    video.tile = byte((high_nibble(attributes2)) + mem_b0)
    y_pos = tanks[slot].y
    x_pos = tanks[slot].x
    saved = pull()
    add_eight_times_a_to_tile_then_emit_pair(value=saved, pixel_x=x_pos, pixel_y=y_pos)
    return

def render_tank_state_offset_sprite(slot):
    state = tanks[slot].state
    value2 = byte((low_nibble(state)) - 7)
    if (((low_nibble(state)) - 7) & 0x80) != 0:
        value2 = byte((value2 ^ 0xff) + 1)
    scaled_value2_0 = shift_byte_left_1_value(value2)
    video.tile = byte(((value2 << 1) & 0xfc) + 0xa1)
    video.attributes = 3
    y_pos = tanks[slot].y
    x_pos = tanks[slot].x
    emit_horizontal_sprite_pair(a=x_pos, slot=x_pos, index=y_pos)
    return

def tick_projectile_motion():
    for slot in projectile_slots_reverse():
        bullet_state_dispatch(projectile_slot=slot)
    return

def bullet_state_dispatch(projectile_slot):
    bullet = projectiles[projectile_slot].state
    scaled_bullet_0 = shift_byte_right_3(bullet)
    direction = (scaled_bullet_0) & 0xfe
    next_generic_map_vram_source_pointers = ram[0xe4d8 + direction]
    ram[generic_map_vram_source_pointers] = next_generic_map_vram_source_pointers
    value6 = ram[0xe4d9 + direction]
    generic_map_vram_source_pointers[1] = value6
    jump(indirect_word(0x0011))

def move_projectile_with_optional_second_step(slot):
    bullet = projectiles[slot].state
    move_projectile_and_conditionally_merge_player_terrain_flags(a=bullet & 3, slot=slot, index=bullet & 3)
    impact = projectiles[slot].modifier
    if projectile_has_second_step(impact):
        move_bullet_by_direction(projectile_slot=slot)
    return

def move_bullet_by_direction(projectile_slot, index):
    dx = bullet_dx_table[index]
    scaled_dx_0 = shift_byte_left_1(dx)
    bullet_x_pos = projectiles[projectile_slot].x
    projectiles[projectile_slot].x = byte((scaled_dx_0) + bullet_x_pos)
    dy = bullet_dy_table[index]
    scaled_dy_1 = shift_byte_left_1(dy)
    bullet_y_pos = projectiles[projectile_slot].y
    projectiles[projectile_slot].y = byte((scaled_dy_1) + bullet_y_pos)
    return byte((scaled_dy_1) + bullet_y_pos)

def decrement_projectile_state_phase(slot):
    next_state = byte(projectiles[slot].state - 1)
    projectiles[slot].state = next_state
    bullet = projectiles[slot].state
    if not (low_nibble(bullet)):
        bullet2 = projectiles[slot].state
        value3 = byte((high_nibble(bullet2)) - 16)
        if value3 != 0:
            value3 = value3 | 3
        projectiles[slot].state = value3
    return

def spawn_projectile(slot):
    if projectiles[slot].state != 0:
        return
    if is_player(slot):
        play_sound(SFX_PLAYER_FIRE)
    state = tanks[slot].state
    projectiles[slot].state = flying(direction_of(state))
    direction = direction_of(state)
    place_projectile_ahead_of_tank(slot, direction)
    set_projectile_modifier(slot, PROJECTILE_PLAIN)
    attributes = tanks[slot].attributes
    return apply_projectile_traits(slot, attributes)

def dispatch_bullet_render_handlers():
    for slot in projectile_slots_reverse():
        dispatch_bullet_render_state(projectile_slot=slot)
    return

def dispatch_bullet_render_state(projectile_slot):
    bullet = projectiles[projectile_slot].state
    scaled_bullet_0 = shift_byte_right_3(bullet)
    direction = (scaled_bullet_0) & 0xfe
    next_generic_map_vram_source_pointers = ram[0xe4e2 + direction]
    ram[generic_map_vram_source_pointers] = next_generic_map_vram_source_pointers
    value6 = ram[0xe4e3 + direction]
    generic_map_vram_source_pointers[1] = value6
    jump(indirect_word(0x0011))

def render_projectile_pair(slot):
    bullet = projectiles[slot].state
    push(bullet & 3)
    bullet_y_pos = projectiles[slot].y
    bullet_x_pos = projectiles[slot].x
    video.attributes = 2
    video.tile = 0xb1
    saved = pull()
    emit_sprite_with_tile_plus_twice_a(value=saved, slot=bullet_x_pos, pixel_y=bullet_y_pos)
    return

def render_projectile_state_effect(slot):
    bullet = projectiles[slot].state
    push(bullet)
    bullet_y_pos = projectiles[slot].y
    bullet_x_pos = projectiles[slot].x
    saved = pull()
    transform_state_nibble_to_tile_offset(value=byte(saved + 64), pixel_x=bullet_x_pos, pixel_y=bullet_y_pos)
    return

def player_fire_pressed():
    for slot in player_slots_reverse():
        state = tanks[slot].state
        if is_active_tank(state):
            pressed = input_state[slot].pressed
            if pressed & FIRE_BUTTONS:
                attributes = tanks[slot].attributes
                can_use_secondary = allows_secondary_projectile(slot=slot)
                if not can_use_secondary:
                    spawn_projectile(slot=slot)
                else:
                    primary = projectiles[slot].state
                    if primary == 0:
                        spawn_projectile(slot=slot)
                    else:
                        secondary = projectiles[slot + 8].state
                        if secondary == 0:
                            state_to_move = projectiles[slot].state
                            projectiles[slot + 8].state = state_to_move
                            x_to_move = projectiles[slot].x
                            projectiles[slot + 8].x = x_to_move
                            y_to_move = projectiles[slot].y
                            projectiles[slot + 8].y = y_to_move
                            modifier_to_move = projectiles[slot].modifier
                            projectiles[slot + 8].modifier = modifier_to_move
                            projectiles[slot].state = 0
                            spawn_projectile(slot=slot)
    return

def enemy_fire():
    value = round_state.enemy_freeze
    if value == 0:
        slot = 7
        while True:
            state = tanks[slot].state
            if state & 0x80:
                if state < 0xe0:
                    random, slot = random_byte(slot=slot)
                    if not (random & 0x1f):
                        spawn_projectile(slot=slot)
            difference = ((slot - 1) & 0xff) - 1
            slot = byte(slot - 1)
            if slot == 1:
                break
    return

def mark_tank_occupied_map_cells():
    for slot in tank_slots_reverse():
        state = tanks[slot].state
        if state & 0x80:
            if state < 0xe0:
                y_pos = tanks[slot].y
                x_pos = tanks[slot].x
                divide_xy_then_setup_vram_pointer(a=byte(x_pos - 8), pixel_x=byte(x_pos - 8), pixel_y=byte(y_pos - 8))
                slot4 = ram[loop_slot]
                next_cached_tank_tile_pointers_and_flags = ram[generic_map_vram_source_pointers]
                cached_tank_tile_pointers_and_flags[slot4] = next_cached_tank_tile_pointers_and_flags
                value5 = generic_map_vram_source_pointers[1]
                cached_tank_tile_pointers_and_flags[slot4 + 8] = value5 & 3
                footprint_cell_offset = 0x21
                if slot4 < 2:
                    value7 = ram[read_word(generic_map_vram_source_pointers) + 0x21]
                    if value7 != 0x21:
                        flags = tanks[slot4].flags
                        tanks[slot4].flags = flags & 0x7f
                    else:
                        flags = tanks[slot4].flags
                        tanks[slot4].flags = 0x80 | flags
                set_map_cell_high_bit()
                x_pos2 = tanks[slot4].x
                if not (x_pos2 & 7):
                    value12 = cached_tank_tile_pointers_and_flags[slot4 + 8]
                    cached_tank_tile_pointers_and_flags[slot4 + 8] = value12 | 0x80
                    set_map_cell_high_bit(cell_offset=0x20)
                y_pos2 = tanks[slot4].y
                if not (y_pos2 & 7):
                    value15 = cached_tank_tile_pointers_and_flags[slot4 + 8]
                    cached_tank_tile_pointers_and_flags[slot4 + 8] = value15 | 0x40
                    set_map_cell_high_bit(cell_offset=1)
    return

def set_map_cell_high_bit(cell_offset):
    value = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    ram[read_word(generic_map_vram_source_pointers) + cell_offset] = value | 0x80
    return value | 0x80

def clear_tank_occupied_map_cells():
    for slot in tank_slots_reverse():
        state = tanks[slot].state
        if state & 0x80:
            if state < 0xe0:
                next_generic_map_vram_source_pointers = cached_tank_tile_pointers_and_flags[slot]
                ram[generic_map_vram_source_pointers] = next_generic_map_vram_source_pointers
                value3 = cached_tank_tile_pointers_and_flags[slot + 8]
                generic_map_vram_source_pointers[1] = (value3 & 3) | 4
                clear_map_cell_high_bit(cell_offset=0x21)
                value6 = cached_tank_tile_pointers_and_flags[slot + 8]
                if value6 & 0x80:
                    clear_map_cell_high_bit(cell_offset=0x20)
                value8 = cached_tank_tile_pointers_and_flags[slot + 8]
                if value8 & 0x40:
                    clear_map_cell_high_bit(cell_offset=1)
    return

def clear_map_cell_high_bit(cell_offset):
    value = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    ram[read_word(generic_map_vram_source_pointers) + cell_offset] = value & 0x7f
    return value & 0x7f

def draw_pickup_sprite():
    pickup_x = pickup.x
    pickup_y = pickup.y
    video.attribute_mask = 0
    emit_horizontal_sprite_pair(a=0, slot=pickup_x, index=pickup_y)
    video.attribute_mask = 0x20

def update_powerup_lifetime_and_render():
    powerup_x_pos = pickup.x
    if powerup_x_pos != 0:
        powerup_wait = pickup.cooldown
        if powerup_wait == 0:
            frame = world.frame
            if frame & 8:
                video.attributes = 2
                powerup_type_value = pickup.kind
                tile_group = shift_byte_left_2(powerup_type_value)
                video.tile = byte(tile_group + 0x81)
                draw_pickup_sprite()
        else:
            next_powerup_cooldown = byte(pickup.cooldown - 1)
            pickup.cooldown = next_powerup_cooldown
            if next_powerup_cooldown != 0:
                video.attributes = 2
                video.tile = 0x3b
                draw_pickup_sprite()
            else:
                pickup.x = 0
    return

def update_tank_flash_rendering():
    ram[loop_slot] = 1
    while True:
        slot = ram[loop_slot]
        hit_immunity_timer_value = hit_immunity_timer[slot]
        if hit_immunity_timer_value != 0:
            frame = world.frame
            if not (frame & 0x3f):
                value = byte(hit_immunity_timer[slot] - 1)
                hit_immunity_timer[slot] = value
            video.attributes = 2
            y_pos = tanks[slot].y
            x_pos = tanks[slot].x
            frame2 = world.frame
            shift_out_bit = (frame2 & 2) >> 7
            video.tile = ((frame2 & 2) << 1) + 41
            emit_horizontal_sprite_pair(a=((frame2 & 2) << 1) + 41, slot=x_pos, index=y_pos)
        value = byte(ram[loop_slot] - 1)
        ram[loop_slot] = value
        if value & 0x80:
            break
    return

def blink_status_rows_while_countdown_ends():
    remaining = stage_flow.delay
    if remaining < 4:
        frame3 = world.frame
        if not (frame3 & 0x10):
            queue_status_vram_update()
        else:
            queue_status_vram_variant()

def update_round_transition_countdowns_and_dispatch():
    value = stage_flow.delay
    if value != 0:
        frame = world.frame
        if not (low_nibble(frame)):
            frame2 = world.frame
            if not (frame2 & 0x3f):
                value = byte(stage_flow.delay - 1)
                stage_flow.delay = value
                if value == 0:
                    queue_status_vram_update()
                else:
                    blink_status_rows_while_countdown_ends()
            else:
                blink_status_rows_while_countdown_ends()
    value6 = round_state.base_state
    if value6 == 0:
        return
    if value6 & 0x80:
        return
    video.attributes = 3
    value = byte(round_state.base_state - 1)
    round_state.base_state = value
    value8 = round_state.base_state
    scaled_value8_0 = shift_byte_right_2(value8)
    value11 = byte((scaled_value8_0) - 5)
    if (((scaled_value8_0) - 5) & 0x80) != 0:
        value11 = byte((value11 ^ 0xff) + 1)
    value13 = byte(value11 - 5)
    if ((value11 - 5) & 0x80) != 0:
        value13 = byte((value13 ^ 0xff) + 1)
    scaled_value13_1 = shift_byte_left_1(value13)
    direction = scaled_value13_1
    next_generic_map_vram_source_pointers = ram[0xe306 + direction]
    ram[generic_map_vram_source_pointers] = next_generic_map_vram_source_pointers
    value17 = ram[0xe307 + direction]
    generic_map_vram_source_pointers[1] = value17
    jump(indirect_word(0x0011))

def draw_center_animation_tile_f1():
    a_value = 0xf1
    video.tile = 0xf1
    emit_horizontal_sprite_pair(a=0xf1, slot=0x78, index=0xd8)
    return

def draw_center_animation_tile_f5():
    a_value = 0xf5
    video.tile = 0xf5
    emit_horizontal_sprite_pair(a=0xf5, slot=0x78, index=0xd8)
    return

def draw_center_animation_tile_f9():
    video.tile = 0xf9
    emit_horizontal_sprite_pair(a=0xf9, slot=0x78, index=0xd8)
    return

def draw_effect_tile_with_offset(value, pixel_x, pixel_y):
    mem_69 = round_effect_and_enemy_spawn_state[1]
    a_value = value + mem_69
    a_value2 = byte(value + mem_69)
    video.tile = byte(value + mem_69)
    emit_horizontal_sprite_pair(a=byte(value + mem_69), slot=pixel_x, index=pixel_y)
    return

def draw_center_animation_grid_offset_0():
    round_effect_and_enemy_spawn_state[1] = 0
    draw_four_effect_tiles()
    return

def draw_center_animation_grid_offset_10():
    round_effect_and_enemy_spawn_state[1] = 0x10
    draw_four_effect_tiles()
    return

def draw_four_effect_tiles():
    draw_effect_tile_with_offset(value=0xd1, pixel_x=0x70, pixel_y=0xd0)
    draw_effect_tile_with_offset(value=0xd5, pixel_x=0x80, pixel_y=0xd0)
    draw_effect_tile_with_offset(value=0xd9, pixel_x=0x70, pixel_y=0xe0)
    draw_effect_tile_with_offset(value=0xdd, pixel_x=0x80, pixel_y=0xe0)
    return

def initialize_tank_slot(slot):
    tanks[slot].attributes = 0
    if slot >= 2:
        next_round_effect_and_enemy_spawn_state = byte(round_state.spawn_lane + 1)
        round_state.spawn_lane = next_round_effect_and_enemy_spawn_state
        direction = round_state.spawn_lane
        if direction == 3:
            round_state.spawn_lane = 0
            direction = 0
        next_x = ram[0xe474 + direction]
        tanks[slot].x = next_x
        next_y = ram[0xe477 + direction]
        tanks[slot].y = next_y
        enemies_left_to_spawn = round_state.enemies_remaining
        if enemies_left_to_spawn == 3 or enemies_left_to_spawn == 0x0a or enemies_left_to_spawn == 0x11:
            tanks[slot].attributes = 4
            pickup.x = 0
    else:
        value2 = ram[0xe47a + slot]
        tanks[slot].x = value2
        value3 = ram[0xe47c + slot]
        tanks[slot].y = value3
        control_cooldown[slot] = 0
    tanks[slot].state = 0xf0
    y_pos = tanks[slot].y
    x_pos = tanks[slot].x
    render_four_table_selected_parts(value=0x0f, pixel_x=x_pos, pixel_y=y_pos)
    return

def configure_spawned_tank_slot(slot):
    value = ram[0xe47e + slot]
    tanks[slot].state = value
    if slot >= 2:
        while True:
            index = ram[enemy_attribute_script_index]
            value4 = ram[stage_parameter_bytes + index]
            if value4 == 0:
                value = byte(ram[enemy_attribute_script_index] + 1)
                ram[enemy_attribute_script_index] = value
                continue
            break
        ram[stage_parameter_bytes + index] = byte(value4 - 1)
        mode = world.mode
        if mode == 0:
            stage_number = world.stage
        else:
            stage_number = 0x23
        stage_table_offset = shift_byte_left_2(byte(stage_number - 1))
        enemy_class = ram[enemy_attribute_script_index]
        attribute_index = byte(stage_table_offset + enemy_class)
        spawn_attributes = stage_enemy_attributes_table[attribute_index]
        if spawn_attributes == 0xe0:
            spawn_attributes = spawn_attributes | 3
    else:
        hit_immunity_timer[slot] = 3
        spawn_attributes = ram[0x101 + slot]
    attributes = tanks[slot].attributes
    merged_delta = (spawn_attributes | attributes) - 0xe7
    merged_attributes = spawn_attributes | attributes
    if merged_attributes == 0xe7:
        merged_attributes = 0xe4
    tanks[slot].attributes = merged_attributes
    tank_sprite_phase_or_flip[slot] = 0
    return 0

def clear_bullet_states():
    next_state = 0
    slot = 9
    while True:
        projectiles[slot].state = next_state
        slot = byte(slot - 1)
        if slot & 0x80:
            break
    return next_state

def clear_tank_states_and_flags():
    value = 0
    slot = 7
    while True:
        tanks[slot].state = value
        tanks[slot].flags = value
        slot = byte(slot - 1)
        if slot & 0x80:
            break
    return value

def merge_tank_state_low_nibble(tank_slot, new_tank_state_class):
    ram[scratch] = new_tank_state_class
    state = tanks[tank_slot].state
    scratch_value = ram[scratch]
    tanks[tank_slot].state = (low_nibble(state)) | scratch_value
    return (low_nibble(state)) | scratch_value

def load_stage_parameters():
    mode = world.mode
    if mode == 0:
        stage_number = world.stage
    else:
        stage_number = 0x23
    stage_table_offset = shift_byte_left_2_value(byte(stage_number - 1))
    class_0_count = stage_enemy_counts_table[stage_table_offset]
    ram[stage_parameter_bytes] = class_0_count
    class_1_count = ram[stage_enemy_counts_table + 1 + stage_table_offset]
    stage_parameter_bytes[1] = class_1_count
    class_2_count = ram[stage_enemy_counts_table + 2 + stage_table_offset]
    stage_parameter_bytes[2] = class_2_count
    class_3_count = ram[stage_enemy_counts_table + 3 + stage_table_offset]
    stage_parameter_bytes[3] = class_3_count
    return class_3_count

def input_to_direction(held):
    right_pressed, after_right = take_high_bit(held)
    if not right_pressed:
        left_pressed, after_left = take_high_bit(after_right)
        if not left_pressed:
            down_pressed, after_down = take_high_bit(after_left)
            if not down_pressed:
                up_pressed, after_up = take_high_bit(after_down)
                if not up_pressed:
                    return NO_DIRECTION
                return DIR_UP
            return DIR_DOWN
        return DIR_LEFT
    return DIR_RIGHT

def move_projectiles_and_terrain_impact():
    for slot in projectile_slots_reverse():
        bullet = projectiles[slot].state
        if (high_nibble(bullet)) != 0x40:
            continue
        impact = projectiles[slot].modifier
        if impact == 0:
            frame = world.frame
            if ((slot ^ frame) & 1) == 0:
                continue
        bullet2 = projectiles[slot].state
        direction = bullet2 & 3
        step_x = step_dx_table[direction]
        if step_x & 0x80:
            step_x = byte((step_x ^ 0xff) + 1)
        ram[step_sign_x] = step_x
        scaled_step_x_0 = shift_byte_left_2(step_x)
        ram[delta_x] = scaled_step_x_0
        step_y = step_dy_table[direction]
        if step_y & 0x80:
            step_y = byte((step_y ^ 0xff) + 1)
        ram[step_sign_y] = step_y
        scaled_step_y_1 = shift_byte_left_2(step_y)
        ram[delta_y] = scaled_step_y_1
        bullet_y_pos = projectiles[slot].y
        bullet_x_pos = projectiles[slot].x
        impact_found_1 = set_map_probe_and_tail_call_lookup(a=bullet_x_pos, slot=bullet_x_pos, index=bullet_y_pos)
        if impact_found_1 != 0:
            slot4 = ram[loop_slot]
            bullet_y_pos2 = projectiles[slot4].y
            delta_x_value = ram[delta_x]
            ram[probe_y] = byte(bullet_y_pos2 + delta_x_value)
            bullet_x_pos2 = projectiles[slot4].x
            delta_y_value = ram[delta_y]
            ram[probe_x] = byte(bullet_x_pos2 + delta_y_value)
            handle_projectile_map_collision()
        slot6 = ram[loop_slot]
        bullet_y_pos3 = projectiles[slot6].y
        mem_54 = ram[step_sign_x]
        bullet_x_pos3 = projectiles[slot6].x
        mem_55 = ram[step_sign_y]
        impact_found_2 = set_map_probe_and_tail_call_lookup(a=byte(bullet_x_pos3 - mem_55), slot=byte(bullet_x_pos3 - mem_55), index=byte(bullet_y_pos3 - mem_54))
        if impact_found_2 != 0:
            slot9 = ram[loop_slot]
            bullet_y_pos4 = projectiles[slot9].y
            delta_x_value = ram[delta_x]
            mem_54 = ram[step_sign_x]
            ram[probe_y] = byte((byte(bullet_y_pos4 - delta_x_value)) - mem_54)
            bullet_x_pos4 = projectiles[slot9].x
            delta_y_value = ram[delta_y]
            mem_55 = ram[step_sign_y]
            ram[probe_x] = byte((byte(bullet_x_pos4 - delta_y_value)) - mem_55)
            handle_projectile_map_collision()
    return

def set_map_probe_and_tail_call_lookup(slot, index):
    ram[probe_x] = slot
    ram[probe_y] = index
    divide_xy_then_setup_vram_pointer(pixel_x=slot, pixel_y=index)
    fall_into(handle_projectile_map_collision)

def handle_projectile_map_collision(cell_offset):
    compute_attribute_quadrant_mask()
    collision_mask = test_cell_high_nibble_with_mask(cell_offset=cell_offset)
    if collision_mask == 0:
        return 0
    value = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    if (value & 0xfc) == 0xc8:
        value3 = round_state.base_state
        if value3 != 0:
            round_state.base_state = 0x27
            audio_commands_and_event_flags[11] = 1
            audio_commands_and_event_flags[7] = 1
            draw_two_fixed_text_rows()
            slot2 = ram[loop_slot]
            projectiles[slot2].state = 0x33
            return 0
    value7 = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    if value7 >= 18:
        return 0
    slot = ram[loop_slot]
    projectiles[slot].state = 0x33
    value9 = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
    if value9 == 0x11:
        if slot >= 2:
            return 0
        audio_commands_and_event_flags[13] = 1
        return 0
    impact = projectiles[slot].modifier
    if not projectile_clears_cell(impact):
        value13 = ram[read_word(generic_map_vram_source_pointers) + cell_offset]
        if value13 == 0x10:
            if slot >= 2:
                return 0
            audio_commands_and_event_flags[13] = 1
            return 0
        if slot < 2:
            audio_commands_and_event_flags[12] = 1
        clear_cell_mask_and_queue_update(tank_slot=slot, cell_offset=cell_offset)
        return 1
    store_cell_and_queue_single_vram_update(value=0, slot=slot, cell_offset=cell_offset)
    audio_commands_and_event_flags[12] = 1
    return 0

def resolve_enemy_shots_against_players():
    for player_slot in player_slots_reverse():
        state = tanks[player_slot].state
        if not is_active_tank(state):
            continue
        for projectile_slot in enemy_projectile_slots_reverse():
            bullet = projectiles[projectile_slot].state
            if not is_flying_projectile(bullet):
                continue
            bullet_x_pos = projectiles[projectile_slot].x
            x_pos = tanks[player_slot].x
            axis_distance_0 = byte_axis_distance(bullet_x_pos, x_pos)
            if axis_distance_0 >= TANK_HIT_AXIS_LIMIT:
                continue
            bullet_y_pos = projectiles[projectile_slot].y
            y_pos = tanks[player_slot].y
            axis_distance_1 = byte_axis_distance(bullet_y_pos, y_pos)
            if axis_distance_1 >= TANK_HIT_AXIS_LIMIT:
                continue
            projectiles[projectile_slot].state = PROJECTILE_IMPACT_START
            hit_immunity_timer_value = hit_immunity_timer[player_slot]
            if hit_immunity_timer_value == 0:
                tanks[player_slot].state = TANK_EXPLOSION_START
                play_sound(SFX_PLAYER_DESTROYED)
                ram[0x101 + player_slot] = 0
                tanks[player_slot].attributes = 0
                break
            projectiles[projectile_slot].state = 0

def resolve_player_shots_against_enemies():
    for enemy_slot in byte_slots(loop_slot, 8, 2):
        state2 = tanks[enemy_slot].state
        if not is_active_tank(state2):
            continue
        for candidate_projectile in byte_slots(loop_inner, 10):
            if not is_player_projectile(candidate_projectile):
                continue
            projectile_slot = ram[loop_inner]
            bullet2 = projectiles[projectile_slot].state
            if not is_flying_projectile(bullet2):
                continue
            bullet_x_pos2 = projectiles[projectile_slot].x
            x_pos = tanks[enemy_slot].x
            axis_distance_2 = byte_axis_distance(bullet_x_pos2, x_pos)
            if axis_distance_2 >= TANK_HIT_AXIS_LIMIT:
                continue
            bullet_y_pos2 = projectiles[projectile_slot].y
            y_pos = tanks[enemy_slot].y
            axis_distance_3 = byte_axis_distance(bullet_y_pos2, y_pos)
            if axis_distance_3 >= TANK_HIT_AXIS_LIMIT:
                continue
            projectiles[projectile_slot].state = PROJECTILE_IMPACT_START
            attributes = tanks[enemy_slot].attributes
            if attributes & 4:
                _, enemy_slot, _ = place_powerup()
                attributes_after_bonus = tanks[enemy_slot].attributes
                if attributes_after_bonus == 0xe4:
                    value = byte(tanks[enemy_slot].attributes - 1)
                    tanks[enemy_slot].attributes = value
            attributes3 = tanks[enemy_slot].attributes
            if not (attributes3 & 3):
                tanks[enemy_slot].state = TANK_EXPLOSION_START
                play_sound(SFX_ENEMY_DESTROYED)
                attributes4 = tanks[enemy_slot].attributes
                score_class = enemy_score_class(attributes4)
                inner5 = ram[loop_inner]
                ram[probe_x] = inner5 & 1
                if inner5 & 1:
                    score_kind = score_class
                    value = byte(stage_results_counts_and_totals[score_kind + 4] + 1)
                    stage_results_counts_and_totals[score_kind + 4] = value
                else:
                    score_kind = score_class
                    value = byte(stage_results_counts_and_totals[score_kind] + 1)
                    stage_results_counts_and_totals[score_kind] = value
                mode = world.mode
                if mode != 2:
                    value36 = ram[0xe8ba + score_kind]
                    initialize_score_increment_record(value=value36)
                    probe_x_value = ram[probe_x]
                    add_seven_decimal_digits(slot=probe_x_value)
                    update_bonus_life_counters()
                break
            value = byte(tanks[enemy_slot].attributes - 1)
            tanks[enemy_slot].attributes = value
            play_sound(SFX_ENEMY_ARMOR_HIT)

def resolve_friendly_fire():
    for player_slot in player_slots_reverse():
        state3 = tanks[player_slot].state
        if not is_active_tank(state3):
            continue
        for candidate_projectile in byte_slots(loop_inner, 10):
            if not is_player_projectile(candidate_projectile):
                continue
            projectile_slot = ram[loop_inner]
            bullet3 = projectiles[projectile_slot].state
            if not is_flying_projectile(bullet3):
                continue
            player_index = ram[loop_slot]
            projectile_index = ram[loop_inner]
            if projectile_belongs_to_player(player_index, projectile_index):
                continue
            bullet_x_pos3 = projectiles[projectile_slot].x
            x_pos = tanks[player_slot].x
            axis_distance_4 = byte_axis_distance(bullet_x_pos3, x_pos)
            if axis_distance_4 >= TANK_HIT_AXIS_LIMIT:
                continue
            bullet_y_pos3 = projectiles[projectile_slot].y
            y_pos = tanks[player_slot].y
            axis_distance_5 = byte_axis_distance(bullet_y_pos3, y_pos)
            if axis_distance_5 >= TANK_HIT_AXIS_LIMIT:
                continue
            projectiles[projectile_slot].state = PROJECTILE_IMPACT_START
            shield_timer = hit_immunity_timer[player_slot]
            if shield_timer == 0:
                cooldown = control_cooldown[player_slot]
                if cooldown != 0:
                    continue
                mode = world.mode
                if mode == 2:
                    continue
                control_cooldown[player_slot] = PLAYER_STUN_COUNT
                break
            projectiles[projectile_slot].state = 0

def projectile_tank_hits():
    resolve_enemy_shots_against_players()
    resolve_player_shots_against_enemies()
    resolve_friendly_fire()
    return

def place_powerup():
    audio_commands_and_event_flags[9] = 1
    while True:
        random, _ = random_byte()
        next_powerup_x = powerup_coordinate_from_index(random_index_0_to_3=random & 3)
        pickup.x = next_powerup_x
        random2, _ = random_byte()
        next_powerup_y = powerup_coordinate_from_index(random_index_0_to_3=random2 & 3)
        pickup.y = next_powerup_y
        pickup.kind = 0xff
        pickup.cooldown = 0
        check_powerup_pickup()
        powerup_wait = pickup.cooldown
        if powerup_wait == 0:
            break
    random3, _ = random_byte()
    direction = random3 & 7
    next_powerup_type = ram[0xe8fa + direction]
    pickup.kind = next_powerup_type
    pickup.cooldown = 0
    slot5 = ram[loop_slot]
    inner = ram[loop_inner]
    return 0, slot5, inner

def powerup_coordinate_from_index(random_index_0_to_3):
    ram[scratch] = random_index_0_to_3
    doubled_index = shift_byte_left_1(random_index_0_to_3)
    saved_index = ram[scratch]
    six_times_index = double_byte_sum(doubled_index, saved_index)
    return shift_byte_left_3(byte(six_times_index + 6))

def projectile_overlaps():
    ram[loop_slot] = 9
    while True:
        slot = ram[loop_slot]
        if not (slot & 6):
            slot2 = ram[loop_slot]
            bullet = projectiles[slot2].state
            if (high_nibble(bullet)) == 0x40:
                for inner in byte_slots(loop_inner, 10):
                    ram[scratch] = inner & 7
                    slot3 = ram[loop_slot]
                    scratch_value = ram[scratch]
                    direction = inner
                    if (slot3 & 7) == scratch_value:
                        continue
                    bullet2 = ram[bullet_state + direction]
                    if (high_nibble(bullet2)) == 0x40:
                        bullet_x_pos = ram[bullet_x + direction]
                        bullet_x_pos2 = projectiles[slot2].x
                        axis_distance_0 = byte_axis_distance(bullet_x_pos, bullet_x_pos2)
                        if axis_distance_0 < PROJECTILE_AXIS_LIMIT:
                            bullet_y_pos = ram[bullet_y + direction]
                            bullet_y_pos2 = projectiles[slot2].y
                            axis_distance_1 = byte_axis_distance(bullet_y_pos, bullet_y_pos2)
                            if axis_distance_1 < PROJECTILE_AXIS_LIMIT:
                                projectiles[slot2].state = 0
                                ram[bullet_state + direction] = 0
        value = byte(ram[loop_slot] - 1)
        ram[loop_slot] = value
        if value & 0x80:
            break
    return

def check_powerup_pickup():
    powerup_x_pos = pickup.x
    if powerup_x_pos == 0:
        return
    powerup_wait = pickup.cooldown
    if powerup_wait != 0:
        return
    transition_menu_and_ppu_phase_state[4] = 1
    fall_into(powerup_dispatch)

def powerup_dispatch():
    for slot in remaining_byte_slots(transition_menu_and_ppu_phase_state[4]):
        state = tanks[slot].state
        if not (state & 0x80):
            continue
        if state >= 0xe0:
            continue
        x_pos = tanks[slot].x
        powerup_x_pos = pickup.x
        axis_distance_0 = byte_axis_distance(x_pos, powerup_x_pos)
        if axis_distance_0 >= PICKUP_AXIS_LIMIT:
            continue
        y_pos = tanks[slot].y
        powerup_y_pos = pickup.y
        axis_distance_1 = byte_axis_distance(y_pos, powerup_y_pos)
        if axis_distance_1 >= PICKUP_AXIS_LIMIT:
            continue
        pickup.cooldown = 0x32
        powerup_type_value = pickup.kind
        if powerup_type_value & 0x80:
            return
        mode = world.mode
        if mode != 2:
            initialize_score_increment_record(value=0x50)
            slot3 = transition_menu_and_ppu_phase_state[4]
            add_seven_decimal_digits(slot=slot3)
            update_bonus_life_counters()
            slot5 = transition_menu_and_ppu_phase_state[4]
            audio_commands_and_event_flags[6] = 1
        value10 = pickup.kind
        scaled_value10_0 = shift_byte_left_1(value10)
        direction = scaled_value10_0
        next_generic_map_vram_source_pointers = ram[0xe9e2 + direction]
        ram[generic_map_vram_source_pointers] = next_generic_map_vram_source_pointers
        value13 = ram[0xe9e3 + direction]
        generic_map_vram_source_pointers[1] = value13
        saved = pull()
        saved2 = pull()
        jump(indirect_word(0x0011))
    return

def set_tank_effect_timer_10(slot):
    hit_immunity_timer[slot] = 0x0a
    return 0x0a

def set_global_pause_timer_10():
    round_state.enemy_freeze = 0x0a
    return 0x0a

def start_timed_display_when_68_negative():
    value = round_state.base_state
    if value & 0x80:
        queue_status_vram_variant()
        stage_flow.delay = 0x14
    return

def promote_slot_attribute_60_to_80(slot):
    value = ram[0x101 + slot]
    if value != 0x60:
        ram[0x101 + slot] = byte(value + 32)
        tanks[slot].attributes = byte(value + 32)
    return

def clear_active_enemy_tanks():
    ram[loop_slot] = 7
    audio_commands_and_event_flags[10] = 1
    while True:
        slot = ram[loop_slot]
        state = ram[tank_state + slot]
        if state & 0x80:
            if state < 0xe0:
                ram[tank_state + slot] = 0x73
                ram[tank_attributes + slot] = 0
        next_loop_slot = byte(ram[loop_slot] - 1)
        ram[loop_slot] = next_loop_slot
        slot2 = ram[loop_slot]
        if slot2 == 1:
            break
    return slot2

def increment_life_and_mark_life_display_dirty(slot):
    next_lives = byte(lives[slot] + 1)
    lives[slot] = next_lives
    audio_commands_and_event_flags[4] = 1
    audio_commands_and_event_flags[5] = 1
    fall_into(return_noop)

def return_noop():
    return

def continue_audio_stream():
    label block_eb88:
    while True:
        result8 = read_next_audio_sequence_byte()
        if result8 >= 0xe8:
            inline_audio_dispatch(value=byte(result8 - 0xe8 - (1 - int(result8 >= 0xe8))))
        else:
            if result8 == 0x60:
                label block_ebd7:
                next_ram = ram[read_word(audio_state_workspace) + 6]
                y_value = 7
                ram[read_word(audio_state_workspace) + 7] = next_ram
                while True:
                    value2 = ram[audio_state_workspace]
                    ram[audio_state_workspace] = byte(value2 + 8)
                    if (value2 + 8) > 0xff:
                        value = byte(audio_state_workspace[1] + 1)
                        audio_state_workspace[1] = value
                    value = byte(audio_state_workspace[4] + 1)
                    audio_state_workspace[4] = value
                    audio_state_workspace_value = audio_state_workspace[4]
                    mem_f5 = audio_state_workspace[5]
                    if audio_state_workspace_value < mem_f5:
                        slot = audio_state_workspace[4]
                        value = audio_commands_and_event_flags[slot]
                        if value != 0:
                            if value != 1:
                                value5 = ram[read_word(audio_state_workspace) + 7]
                                ram[read_word(audio_state_workspace) + 7] = byte(value5 - 1)
                                if value5 == 1:
                                    label block_eb85:
                                    select_audio_sequence_pointer()
                                    goto block_eb88
                                if value5 == 1:
                                    label block_eb4f:
                                    ram[read_word(audio_state_workspace) + 5] = 0
                                    select_audio_sequence_pointer(y=5)
                                    result2 = read_next_audio_sequence_byte(y=5)
                                    ram[read_word(audio_state_workspace) + 0] = result2
                                    result3 = read_next_audio_sequence_byte(y=0)
                                    ram[read_word(audio_state_workspace) + 1] = result3
                                    result4 = read_next_audio_sequence_byte(y=1)
                                    ram[read_word(audio_state_workspace) + 2] = result4
                                    result5 = read_next_audio_sequence_byte(y=2)
                                    ram[read_word(audio_state_workspace) + 4] = result5
                                    value8 = ram[read_word(audio_state_workspace) + 0]
                                    if value8 != 4:
                                        goto block_eb88
                                    result6 = read_next_audio_sequence_byte(y=0)
                                    y_value = 3
                                    ram[read_word(audio_state_workspace) + 3] = result6
                                    if 0 != 1:
                                        goto block_eb88
                                    goto block_eb85
                            else:
                                value2 = byte(audio_commands_and_event_flags[slot] + 1)
                                audio_commands_and_event_flags[slot] = value2
                                goto block_eb4f
                    else:
                        return audio_state_workspace_value
            else:
                if result8 < 96:
                    push(result8)
                    carry_bit = result8 & 0xf8 & 1
                    a_value = (result8 & 0xf8) >> 1
                    carry_bit2 = ((result8 & 0xf8) >> 1) & 1
                    slot4 = (result8 & 0xf8) >> 2
                    value13 = ram[0xece6 + slot4]
                    audio_state_workspace[13] = value13
                    value14 = ram[0xece7 + slot4]
                    audio_state_workspace[14] = value14
                    saved = pull()
                    value15 = saved & 7
                    if value15 != 0:
                        slot5 = value15
                        while True:
                            mem_fd = audio_state_workspace[13]
                            value = mem_fd >> 1
                            audio_state_workspace[13] = value
                            mem_fe = audio_state_workspace[14]
                            value2 = (mem_fe >> 1) + ((mem_fd & 1) << 7)
                            audio_state_workspace[14] = value2
                            scaled_mem_fe_0 = shift_byte_right_1(mem_fe)
                            slot5 = byte(slot5 - 1)
                            if slot5 == 0:
                                break
                    value16 = ram[read_word(audio_state_workspace) + 4]
                    mem_fd = audio_state_workspace[13]
                    ram[read_word(audio_state_workspace) + 4] = (value16 & 0xf8) | mem_fd
                    value19 = audio_state_workspace[14]
                    y_value = 3
                    ram[read_word(audio_state_workspace) + 3] = value19
                    value20 = ram[read_word(audio_state_workspace) + 0]
                    if value20 < 5:
                        goto block_ebd7
                    ram[read_word(audio_state_workspace) + 0] = byte(value20 - 4)
                    goto block_ebd7
                y_value = 6
                ram[read_word(audio_state_workspace) + 6] = byte(result8 - 96 - (1 - int(result8 >= 96)))
                continue

def audio_reset():
    a_value = 0x0f
    ram[0x4015] = 0x0f
    a_value = 0xc0
    ram[0x4017] = 0xc0
    ram[audio_state_workspace] = 0x1c
    audio_state_workspace[1] = 3
    slot = 0
    index = slot
    while True:
        ram[read_word(audio_state_workspace) + index] = index
        audio_commands_and_event_flags[slot] = index
        audio_state_workspace_value = ram[audio_state_workspace]
        ram[audio_state_workspace] = byte(audio_state_workspace_value + 8)
        if (audio_state_workspace_value + 8) > 0xff:
            next_audio_state_workspace = byte(audio_state_workspace[1] + 1)
            audio_state_workspace[1] = next_audio_state_workspace
        difference = ((slot + 1) & 0xff) - 28
        slot = byte(slot + 1)
        if slot == 0x1c:
            break
    return

def audio_tick():
    value = world.paused
    if value != 0:
        label block_ea88:
        audio_state_workspace[5] = 1
    else:
        audio_state_workspace[5] = 0x1c
        if 0 == 1:
            goto block_ea88
    next_audio_state_workspace = 0
    slot = 3
    while True:
        audio_state_workspace[slot + 9] = next_audio_state_workspace
        slot = byte(slot - 1)
        if slot & 0x80:
            break
    audio_state_workspace[4] = 0
    ram[audio_state_workspace] = 0x1c
    audio_state_workspace[1] = 3
    while True:
        audio_state_workspace_value = audio_state_workspace[4]
        value8 = audio_commands_and_event_flags[audio_state_workspace_value]
        if value8 != 0:
            value9 = ram[read_word(audio_state_workspace) + 0]
            if value9 != 0:
                if value9 < 5:
                    slot5 = byte(value9 - 1)
                    value12 = audio_state_workspace[slot5 + 9]
                    if value12 == 0:
                        audio_state_workspace[slot5 + 9] = 1
                        ram[read_word(audio_state_workspace) + 0] = byte(slot5 + 5)
                        scaled_slot5_0 = shift_byte_left_2(slot5)
                        audio_state_workspace[13] = 4
                        slot6 = scaled_slot5_0
                        index2 = 0
                        while True:
                            y_value = byte(index2 + 1)
                            index2_before = index2
                            index2 = byte(index2_before + 1)
                            next_ram = ram[read_word(audio_state_workspace) + index2]
                            ram[0x4000 + slot6] = next_ram
                            value = byte(audio_state_workspace[13] - 1)
                            audio_state_workspace[13] = value
                            slot6 = byte(slot6 + 1)
                            if value == 0:
                                break
                else:
                    slot3 = byte(value9 - 5)
                    audio_state_workspace[slot3 + 9] = 1
        value21 = ram[audio_state_workspace]
        ram[audio_state_workspace] = byte(value21 + 8)
        if (value21 + 8) > 0xff:
            value = byte(audio_state_workspace[1] + 1)
            audio_state_workspace[1] = value
        value = byte(audio_state_workspace[4] + 1)
        audio_state_workspace[4] = value
        value23 = audio_state_workspace[4]
        mem_f5 = audio_state_workspace[5]
        if value23 >= mem_f5:
            break
    slot7 = 0
    while True:
        audio_state_workspace[13] = slot7
        value24 = audio_state_workspace[slot7 + 9]
        if value24 == 0:
            scaled_slot7_1 = shift_byte_left_3_value(slot7)
            a_value4 = (slot7 << 3) & 0x10
            a_value5 = ((slot7 << 3) & 0x10) ^ 0x10
            slot8 = byte(slot7 << 2)
            ram[0x4000 + slot8] = ((slot7 << 3) & 0x10) ^ 0x10
        slot9 = audio_state_workspace[13]
        difference = ((slot9 + 1) & 0xff) - 4
        slot7 = byte(slot9 + 1)
        if slot7 >= 4:
            break
    audio_state_workspace[4] = 0
    ram[audio_state_workspace] = 0x1c
    audio_state_workspace[1] = 3
    while True:
        slot10 = audio_state_workspace[4]
        value33 = audio_commands_and_event_flags[slot10]
        if value33 == 0:
            label block_eb2e:
            value34 = ram[audio_state_workspace]
            ram[audio_state_workspace] = byte(value34 + 8)
            if (value34 + 8) > 0xff:
                value = byte(audio_state_workspace[1] + 1)
                audio_state_workspace[1] = value
            value = byte(audio_state_workspace[4] + 1)
            audio_state_workspace[4] = value
            value36 = audio_state_workspace[4]
            mem_f5 = audio_state_workspace[5]
            if value36 >= mem_f5:
                return value36
        else:
            if value33 != 1:
                value37 = ram[read_word(audio_state_workspace) + 7]
                ram[read_word(audio_state_workspace) + 7] = byte(value37 - 1)
                if value37 == 1:
                    label block_eb85:
                    select_audio_sequence_pointer()
                    label block_eb88:
                    while True:
                        result8 = read_next_audio_sequence_byte()
                        if result8 >= 0xe8:
                            inline_audio_dispatch(value=byte(result8 - 0xe8 - (1 - int(result8 >= 0xe8))))
                        else:
                            if result8 == 0x60:
                                label block_ebd7:
                                value54 = ram[read_word(audio_state_workspace) + 6]
                                y_value = 7
                                ram[read_word(audio_state_workspace) + 7] = value54
                                goto block_eb2e
                            if result8 < 96:
                                push(result8)
                                carry_bit = result8 & 0xf8 & 1
                                a_value = (result8 & 0xf8) >> 1
                                carry_bit2 = ((result8 & 0xf8) >> 1) & 1
                                slot13 = (result8 & 0xf8) >> 2
                                value45 = ram[0xece6 + slot13]
                                audio_state_workspace[13] = value45
                                value46 = ram[0xece7 + slot13]
                                audio_state_workspace[14] = value46
                                saved = pull()
                                value47 = saved & 7
                                if value47 == 0:
                                    label block_ebbb:
                                    value48 = ram[read_word(audio_state_workspace) + 4]
                                    mem_fd = audio_state_workspace[13]
                                    ram[read_word(audio_state_workspace) + 4] = (value48 & 0xf8) | mem_fd
                                    value51 = audio_state_workspace[14]
                                    y_value = 3
                                    ram[read_word(audio_state_workspace) + 3] = value51
                                    value52 = ram[read_word(audio_state_workspace) + 0]
                                    if value52 < 5:
                                        goto block_ebd7
                                    ram[read_word(audio_state_workspace) + 0] = byte(value52 - 4)
                                    goto block_ebd7
                                slot14 = value47
                                while True:
                                    mem_fd = audio_state_workspace[13]
                                    value = mem_fd >> 1
                                    audio_state_workspace[13] = value
                                    mem_fe = audio_state_workspace[14]
                                    value2 = (mem_fe >> 1) + ((mem_fd & 1) << 7)
                                    audio_state_workspace[14] = value2
                                    scaled_mem_fe_2 = shift_byte_right_1(mem_fe)
                                    slot14 = byte(slot14 - 1)
                                    if slot14 == 0:
                                        break
                                goto block_ebbb
                            y_value = 6
                            ram[read_word(audio_state_workspace) + 6] = byte(result8 - 96 - (1 - int(result8 >= 96)))
                            continue
                else:
                    if value37 != 1:
                        goto block_eb2e
                    label block_eb4f:
                    ram[read_word(audio_state_workspace) + 5] = 0
                    select_audio_sequence_pointer(y=5)
                    result2 = read_next_audio_sequence_byte(y=5)
                    ram[read_word(audio_state_workspace) + 0] = result2
                    result3 = read_next_audio_sequence_byte(y=0)
                    ram[read_word(audio_state_workspace) + 1] = result3
                    result4 = read_next_audio_sequence_byte(y=1)
                    ram[read_word(audio_state_workspace) + 2] = result4
                    result5 = read_next_audio_sequence_byte(y=2)
                    ram[read_word(audio_state_workspace) + 4] = result5
                    value40 = ram[read_word(audio_state_workspace) + 0]
                    if value40 != 4:
                        goto block_eb88
                    result6 = read_next_audio_sequence_byte(y=0)
                    y_value = 3
                    ram[read_word(audio_state_workspace) + 3] = result6
                    if 0 != 1:
                        goto block_eb88
                    goto block_eb85
            else:
                value = byte(audio_commands_and_event_flags[slot10] + 1)
                audio_commands_and_event_flags[slot10] = value
                goto block_eb4f

def audio_finish_event_and_decrement_duration():
    audio_state_workspace_value = audio_state_workspace[4]
    audio_commands_and_event_flags[audio_state_workspace_value] = 0
    ram[read_word(audio_state_workspace) + 0] = 0
    value25 = ram[read_word(audio_state_workspace) + 5]
    ram[read_word(audio_state_workspace) + 5] = byte(value25 - 1)
    label block_eb2e:
    while True:
        value2 = ram[audio_state_workspace]
        ram[audio_state_workspace] = byte(value2 + 8)
        if (value2 + 8) > 0xff:
            value = byte(audio_state_workspace[1] + 1)
            audio_state_workspace[1] = value
        value = byte(audio_state_workspace[4] + 1)
        audio_state_workspace[4] = value
        value4 = audio_state_workspace[4]
        mem_f5 = audio_state_workspace[5]
        if value4 < mem_f5:
            slot = audio_state_workspace[4]
            value = audio_commands_and_event_flags[slot]
            if value != 0:
                if value != 1:
                    value5 = ram[read_word(audio_state_workspace) + 7]
                    ram[read_word(audio_state_workspace) + 7] = byte(value5 - 1)
                    if value5 == 1:
                        label block_eb85:
                        select_audio_sequence_pointer()
                        label block_eb88:
                        while True:
                            result8 = read_next_audio_sequence_byte()
                            if result8 >= 0xe8:
                                inline_audio_dispatch(value=byte(result8 - 0xe8 - (1 - int(result8 >= 0xe8))))
                            else:
                                if result8 == 0x60:
                                    label block_ebd7:
                                    next_ram = ram[read_word(audio_state_workspace) + 6]
                                    y_value = 7
                                    ram[read_word(audio_state_workspace) + 7] = next_ram
                                    goto block_eb2e
                                if result8 < 96:
                                    push(result8)
                                    carry_bit = result8 & 0xf8 & 1
                                    a_value = (result8 & 0xf8) >> 1
                                    carry_bit2 = ((result8 & 0xf8) >> 1) & 1
                                    slot4 = (result8 & 0xf8) >> 2
                                    next_audio_state_workspace = ram[0xece6 + slot4]
                                    audio_state_workspace[13] = next_audio_state_workspace
                                    value14 = ram[0xece7 + slot4]
                                    audio_state_workspace[14] = value14
                                    saved = pull()
                                    value15 = saved & 7
                                    if value15 == 0:
                                        label block_ebbb:
                                        value16 = ram[read_word(audio_state_workspace) + 4]
                                        mem_fd = audio_state_workspace[13]
                                        ram[read_word(audio_state_workspace) + 4] = (value16 & 0xf8) | mem_fd
                                        value19 = audio_state_workspace[14]
                                        y_value = 3
                                        ram[read_word(audio_state_workspace) + 3] = value19
                                        value20 = ram[read_word(audio_state_workspace) + 0]
                                        if value20 < 5:
                                            goto block_ebd7
                                        ram[read_word(audio_state_workspace) + 0] = byte(value20 - 4)
                                        goto block_ebd7
                                    slot5 = value15
                                    while True:
                                        mem_fd = audio_state_workspace[13]
                                        value = mem_fd >> 1
                                        audio_state_workspace[13] = value
                                        mem_fe = audio_state_workspace[14]
                                        value2 = (mem_fe >> 1) + ((mem_fd & 1) << 7)
                                        audio_state_workspace[14] = value2
                                        scaled_mem_fe_0 = shift_byte_right_1(mem_fe)
                                        slot5 = byte(slot5 - 1)
                                        if slot5 == 0:
                                            break
                                    goto block_ebbb
                                y_value = 6
                                ram[read_word(audio_state_workspace) + 6] = byte(result8 - 96 - (1 - int(result8 >= 96)))
                                continue
                    elif value5 == 1:
                        label block_eb4f:
                        ram[read_word(audio_state_workspace) + 5] = 0
                        select_audio_sequence_pointer(y=5)
                        result2 = read_next_audio_sequence_byte(y=5)
                        ram[read_word(audio_state_workspace) + 0] = result2
                        result3 = read_next_audio_sequence_byte(y=0)
                        ram[read_word(audio_state_workspace) + 1] = result3
                        result4 = read_next_audio_sequence_byte(y=1)
                        ram[read_word(audio_state_workspace) + 2] = result4
                        result5 = read_next_audio_sequence_byte(y=2)
                        ram[read_word(audio_state_workspace) + 4] = result5
                        value8 = ram[read_word(audio_state_workspace) + 0]
                        if value8 != 4:
                            goto block_eb88
                        result6 = read_next_audio_sequence_byte(y=0)
                        y_value = 3
                        ram[read_word(audio_state_workspace) + 3] = result6
                        if 0 != 1:
                            goto block_eb88
                        goto block_eb85
                else:
                    value2 = byte(audio_commands_and_event_flags[slot] + 1)
                    audio_commands_and_event_flags[slot] = value2
                    goto block_eb4f
        else:
            return value4

def audio_merge_parameter_into_control_low6():
    next_audio_state_workspace = read_next_audio_sequence_byte()
    audio_state_workspace[13] = next_audio_state_workspace
    value24 = ram[read_word(audio_state_workspace) + 1]
    mem_fd = audio_state_workspace[13]
    ram[read_word(audio_state_workspace) + 1] = (value24 & 0x3f) | mem_fd
    return continue_audio_stream()

def audio_merge_parameter_into_control_high2():
    next_audio_state_workspace = read_next_audio_sequence_byte()
    audio_state_workspace[13] = next_audio_state_workspace
    value24 = ram[read_word(audio_state_workspace) + 1]
    mem_fd = audio_state_workspace[13]
    ram[read_word(audio_state_workspace) + 1] = (value24 & 0xc0) | mem_fd
    return continue_audio_stream()

def audio_merge_parameter_into_control_low4():
    next_audio_state_workspace = read_next_audio_sequence_byte()
    audio_state_workspace[13] = next_audio_state_workspace
    value24 = ram[read_word(audio_state_workspace) + 1]
    mem_fd = audio_state_workspace[13]
    ram[read_word(audio_state_workspace) + 1] = (high_nibble(value24)) | mem_fd
    return continue_audio_stream()

def audio_set_stream_byte_2():
    next_ram = read_next_audio_sequence_byte()
    y_value = 2
    ram[read_word(audio_state_workspace) + 2] = next_ram
    return continue_audio_stream()

def audio_set_stream_byte_4():
    next_ram = read_next_audio_sequence_byte()
    y_value = 4
    ram[read_word(audio_state_workspace) + 4] = next_ram
    return continue_audio_stream()

def audio_set_stream_byte_1():
    next_ram = read_next_audio_sequence_byte()
    y_value = 1
    ram[read_word(audio_state_workspace) + 1] = next_ram
    return continue_audio_stream()

def audio_clear_modulation_counters():
    next_audio_state_workspace = 0
    slot7 = 2
    while True:
        audio_state_workspace[slot7 + 6] = next_audio_state_workspace
        slot7 = byte(slot7 - 1)
        if slot7 & 0x80:
            break
    return continue_audio_stream()

def audio_select_counter_lane_zero(prior_value):
    slot = 0
    if slot == 0:
        result = read_next_audio_sequence_byte(x=slot)
        next_audio_state_workspace = byte(audio_state_workspace[slot + 6] + 1)
        audio_state_workspace[slot + 6] = next_audio_state_workspace
        mem_f6 = audio_state_workspace[slot + 6]
        if result != mem_f6:
            fall_into(audio_load_stream_duration)
        audio_state_workspace[slot + 6] = 0
        if 0 == 0:
            pass
        fall_into(audio_increment_stream_duration)
    return audio_select_counter_lane_one_from_status(value=prior_value)

def audio_select_counter_lane_one_from_status(value):
    mem_2a2 = oam_shadow[162]
    sign_bit = mem_2a2 >> 7
    overflow_bit = (mem_2a2 >> 6) & 1
    value = mem_2a2 & value
    result = read_next_audio_sequence_byte(x=1)
    value = byte(audio_state_workspace[7] + 1)
    audio_state_workspace[7] = value
    mem_f6 = audio_state_workspace[7]
    slot = 1
    if result != mem_f6:
        fall_into(audio_load_stream_duration)
    audio_state_workspace[slot + 6] = 0
    if 0 == 0:
        pass
    fall_into(audio_increment_stream_duration)

def audio_select_counter_lane_two():
    result = read_next_audio_sequence_byte(x=2)
    next_audio_state_workspace = byte(audio_state_workspace[8] + 1)
    audio_state_workspace[8] = next_audio_state_workspace
    mem_f6 = audio_state_workspace[8]
    slot = 2
    if result != mem_f6:
        fall_into(audio_load_stream_duration)
    audio_state_workspace[slot + 6] = 0
    if 0 == 0:
        pass
    fall_into(audio_increment_stream_duration)

def audio_increment_stream_duration():
    value24 = ram[read_word(audio_state_workspace) + 5]
    ram[read_word(audio_state_workspace) + 5] = byte(value24 + 1)
    return continue_audio_stream()

def audio_load_stream_duration():
    next_ram = read_next_audio_sequence_byte()
    y_value = 5
    ram[read_word(audio_state_workspace) + 5] = next_ram
    return continue_audio_stream()

def select_audio_sequence_pointer():
    audio_state_workspace_value = audio_state_workspace[4]
    scaled_audio_state_workspace_value_0 = shift_byte_left_1(audio_state_workspace_value)
    slot = scaled_audio_state_workspace_value_0
    next_audio_state_workspace = ram[0xecfe + slot]
    audio_state_workspace[2] = next_audio_state_workspace
    value4 = ram[0xecff + slot]
    audio_state_workspace[3] = value4
    return value4

def read_next_audio_sequence_byte():
    value = audio_state_workspace[4]
    value2 = ram[read_word(audio_state_workspace) + 5]
    value3 = ram[read_word(0xf2) + value2]
    push(value3)
    ram[read_word(audio_state_workspace) + 5] = byte(value2 + 1)
    saved = pull()
    return saved

def inline_audio_dispatch(value):
    scaled_value_0 = shift_byte_left_1(value)
    saved = pull()
    audio_state_workspace[13] = saved
    saved2 = pull()
    audio_state_workspace[14] = saved2
    index = byte((scaled_value_0) + 1)
    next_audio_state_workspace = ram[read_word(0xfd) + index]
    index2 = byte(index + 1)
    value4 = ram[read_word(0xfd) + index2]
    audio_state_workspace[14] = value4
    audio_state_workspace[13] = next_audio_state_workspace
    jump(indirect_word(0x00fd))

def load_stage_map(value):
    if value != 0xff:
        if value >= 36:
            value_before = value
            value = byte(value - 35)
    else:
        value_before = value
        value = 0x24
    ram[scratch] = value
    generic_map_vram_source_pointers[1] = 0xf0
    ram[generic_map_vram_source_pointers] = 0x7a
    while True:
        value = byte(ram[scratch] - 1)
        ram[scratch] = value
        if value != 0:
            add_a_to_word_11_12(value=0x5b)
            continue
        break
    ram[loop_slot] = 0
    next_generic_map_vram_source_pointers = ram[generic_map_vram_source_pointers]
    generic_map_vram_source_pointers[2] = next_generic_map_vram_source_pointers
    value7 = generic_map_vram_source_pointers[1]
    generic_map_vram_source_pointers[3] = value7
    ram[0x57] = 0x10
    while True:
        wait_next_frame()
        ram[0x56] = 0x10
        while True:
            slot = ram[loop_slot]
            scaled_slot_0 = shift_byte_right_1_value(slot)
            slot2 = ram[loop_slot]
            if not (slot2 & 1):
                direction = scaled_slot_0
                value14 = ram[read_word(0x13) + direction]
                scaled_value14_1 = shift_byte_right_4_value(value14)
            else:
                direction = scaled_slot_0
                value12 = ram[read_word(0x13) + direction]
                a_value = low_nibble(value12)
            slot3 = ram[0x56]
            index = ram[0x57]
            render_four_table_selected_parts(pixel_x=slot3, pixel_y=index)
            ram[vram_cursor] = 0
            value = byte(ram[loop_slot] + 1)
            ram[loop_slot] = value
            value20 = ram[0x56]
            ram[0x56] = byte(value20 + 16)
            if (byte(value20 + 16)) == 0xe0:
                break
        value = byte(ram[loop_slot] + 1)
        ram[loop_slot] = value
        value22 = ram[0x57]
        ram[0x57] = byte(value22 + 16)
        if (byte(value22 + 16)) == 0xe0:
            break
    return byte(value22 + 16)

def queue_vram_string_and_maybe_unwind(tile_x, tile_y):
    queue_ff_terminated_vram_string(tile_x=tile_x, tile_y=tile_y)
    value = selectors.raw_013e
    if value != 0x5a:
        saved = pull()
        saved2 = pull()
        return saved2
    return value

def move_projectile_and_conditionally_merge_player_terrain_flags(slot, index):
    move_bullet_by_direction(projectile_slot=slot, index=index)
    value = selectors.raw_013e
    if value == 0x5a:
        scratch_value = ram[scratch]
        push(scratch_value)
        push(index)
        if slot < 2:
            merge_pad_bits_into_tank_flags(slot=slot)
        saved = pull()
        saved2 = pull()
        ram[scratch] = saved2
        return saved2
    return value

def dispatch_tank_state(tank_slot):
    tank_state_dispatch(tank_slot=tank_slot)
    return

def allows_secondary_projectile(slot):
    selector = selectors.raw_013e
    if selector != SELECTOR_ENABLED:
        attributes = tanks[slot].attributes
        eligible = (attributes & SECONDARY_SHOT_MASK) == SECONDARY_SHOT_CLASS
        return eligible
    return 1

def select_table_byte_by_state_flags(slot):
    value = selectors.raw_013e
    if value == 0x5a:
        value3 = selectors.raw_013d
        if value3 == 0x5a:
            value5 = ram[0xfe65 + slot]
            return value5
        value4 = ram[0xfd65 + slot]
        return value4
    value2 = ram[0xd565 + slot]
    return value2

def encode_fire_input_modifiers(fire_buttons):
    push(fire_buttons)
    upgrade_selector = selectors.raw_013d
    if upgrade_selector == 0x5a:
        upgraded_buttons = pull()
        modifier = PROJECTILE_SECOND_MOVE
        if upgraded_buttons >= 2:
            modifier = PROJECTILE_SECOND_MOVE_AND_CLEAR_CELL
        return modifier
    plain_buttons = pull()
    modifier = PROJECTILE_SECOND_MOVE
    if plain_buttons >= 2:
        modifier = PROJECTILE_SECOND_MOVE
    return modifier

def merge_pad_bits_into_tank_flags(slot):
    held = input_state[slot].held
    if held & 3:
        modifier = encode_fire_input_modifiers(fire_buttons=held & 3)
        ram[scratch] = modifier
        impact = projectiles[slot].modifier
        scratch_value = ram[scratch]
        projectiles[slot].modifier = impact | scratch_value
    return

