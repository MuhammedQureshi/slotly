-- Increase the Free monthly allowance without changing the existing locking,
-- overlap, timezone, or rescheduling behaviour in these live functions.
begin;

do $$
declare
  v_function regprocedure;
  v_definition text;
  v_old text := 'if v_count >= 20 then raise exception ''monthly_booking_limit_reached''; end if;';
  v_new text := 'if v_count >= 100 then raise exception ''monthly_booking_limit_reached''; end if;';
begin
  foreach v_function in array array[
    'public.create_booking_with_limit(uuid,uuid,text,text,text,text,integer,timestamptz,timestamptz)'::regprocedure,
    'public.reschedule_booking_with_limit(uuid,timestamptz,timestamptz)'::regprocedure
  ] loop
    v_definition := pg_get_functiondef(v_function);

    -- Stop if either live function has changed unexpectedly. This avoids
    -- replacing unrelated code or silently leaving the old limit active.
    if (length(v_definition) - length(replace(v_definition, v_old, ''))) <> length(v_old) then
      raise exception 'Expected exactly one Free limit check in %', v_function;
    end if;

    execute replace(v_definition, v_old, v_new);
  end loop;
end;
$$;

commit;
