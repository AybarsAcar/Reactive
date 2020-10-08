import React from 'react';
import { FieldRenderProps } from 'react-final-form';
import { DateTimePicker } from 'react-widgets';
import { Form, FormFieldProps, Label } from 'semantic-ui-react';

interface IProps extends FieldRenderProps<Date, HTMLElement>, FormFieldProps {}

const DateInput: React.FC<IProps> = ({
  input,
  width,
  date = false,
  time = false,
  placeholder,
  meta: { touched, error },
  rest,
}) => {
  return (
    <Form.Field error={touched && !!error} width={width}>
      <DateTimePicker
        placeholder={placeholder}
        onBlur={input.onBlur}
        onKeyDown={(e) => e.preventDefault()}
        value={input.value || null}
        onChange={input.onChange}
        date={date}
        time={time}
        {...rest}
      />

      {touched && error && (
        <Label basic color="red">
          {error}
        </Label>
      )}
    </Form.Field>
  );
};

export default DateInput;
