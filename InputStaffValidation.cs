using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class InputStaffValidation : MonoBehaviour
{
    private TMP_InputField inputField;
    public TextMeshProUGUI myText;
    public TextMeshProUGUI iText;

    private void Awake()
    {
        inputField = GetComponent<TMP_InputField>();
        inputField.contentType = TMP_InputField.ContentType.IntegerNumber;
        inputField.onValueChanged.AddListener(OnInputValueChanged);
    }

    public void OnEnable()
    {
        iText.text = myText.text;
    }

    private void OnInputValueChanged(string value)
    {
        if (!string.IsNullOrEmpty(value))
        {
            int intValue;
            if (!int.TryParse(value, out intValue))
            {
                inputField.text = null;
            }
        }
    }
}
