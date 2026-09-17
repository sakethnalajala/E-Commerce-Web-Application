import { useCallback, useRef, useState } from 'react';
import { runValidators } from '@/utils/validators';

/**
 * Small form controller: values, per-field errors, touched state and submit.
 * Fields validate on blur and after the first submit attempt, which keeps the
 * form quiet while the user is still typing.
 */
export const useForm = ({ initialValues = {}, validators = {}, onSubmit }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // State updates are async, so a double Enter/click could start two requests
  // before `submitting` flips. The ref guards synchronously.
  const inFlight = useRef(false);
  const [submitError, setSubmitError] = useState(null);

  const validateField = useCallback(
    (name, nextValues) => {
      const validator = validators[name];
      if (!validator) return null;
      return validator(nextValues[name], nextValues);
    },
    [validators]
  );

  const setValue = useCallback(
    (name, value) => {
      setValues((current) => {
        const next = { ...current, [name]: value };
        // Clear an existing error as soon as the field becomes valid.
        setErrors((currentErrors) => {
          if (!currentErrors[name]) return currentErrors;
          const message = validateField(name, next);
          if (message) return currentErrors;
          const { [name]: _removed, ...rest } = currentErrors;
          return rest;
        });
        return next;
      });
    },
    [validateField]
  );

  const handleChange = useCallback(
    (event) => {
      const { name, value, type, checked } = event.target;
      setValue(name, type === 'checkbox' ? checked : value);
    },
    [setValue]
  );

  const handleBlur = useCallback(
    (event) => {
      const { name } = event.target;
      setTouched((current) => ({ ...current, [name]: true }));
      setValues((current) => {
        const message = validateField(name, current);
        setErrors((currentErrors) =>
          message ? { ...currentErrors, [name]: message } : currentErrors
        );
        return current;
      });
    },
    [validateField]
  );

  /** Maps server-side field errors (422) back onto the form. */
  const setFieldErrors = useCallback((fieldErrors = {}) => {
    setErrors((current) => ({ ...current, ...fieldErrors }));
    setTouched((current) => ({
      ...current,
      ...Object.keys(fieldErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
    }));
  }, []);

  const reset = useCallback((nextValues = initialValues) => {
    setValues(nextValues);
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      if (inFlight.current) return { ok: false, errors: {} };
      setSubmitError(null);

      const validationErrors = runValidators(values, validators);
      setTouched(Object.keys(validators).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

      if (Object.keys(validationErrors).length) {
        setErrors(validationErrors);
        return { ok: false, errors: validationErrors };
      }

      setErrors({});
      inFlight.current = true;
      setSubmitting(true);

      try {
        const result = await onSubmit(values, { setFieldErrors, reset });
        return { ok: true, result };
      } catch (error) {
        if (error.fieldErrors && Object.keys(error.fieldErrors).length) {
          setFieldErrors(error.fieldErrors);
        }
        setSubmitError(error.message);
        return { ok: false, error };
      } finally {
        inFlight.current = false;
        setSubmitting(false);
      }
    },
    [values, validators, onSubmit, setFieldErrors, reset]
  );

  return {
    values,
    errors,
    touched,
    submitting,
    submitError,
    setValue,
    setValues,
    setFieldErrors,
    setSubmitError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    // Convenience spread for <Input {...fieldProps('email')} />
    fieldProps: (name) => ({
      name,
      value: values[name] ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] ? errors[name] : undefined,
    }),
  };
};

export default useForm;
